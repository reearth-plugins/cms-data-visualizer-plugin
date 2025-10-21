import { useEffect } from "react";

import { postMsg } from "@/shared/utils";

type WidgetProperty = {
  api: {
    data_source_type?: "cms_data_visualizer_server" | "cms_integration_api";
    server_base_url?: string;
    server_api_key?: string;
    integration_api_base_url?: string;
    integration_api_key?: string;
    cms_project_id?: string;
    cms_model_id?: string;
    value_filters?: string;
  };
  appearance: {
    marker_appearance?: string;
  };
};

type Schema = {
  id: string;
  key: string;
  multiple: boolean;
  name: string;
  required: boolean;
  type: string;
}[];

// Sub-collect Asset type
type Asset = {
  id: string;
  url: string;
};

type Item = {
  id: string;
  fields: Field[];
};

type Field = {
  id: string;
  key: string;
  type: string;
  value: unknown;
};

export default () => {
  useEffect(() => {
    postMsg("init");
  }, []);

  const handleMessage = async (e: MessageEvent) => {
    if (e.data.action === "init") {
      const widgetProperty = e.data.payload as WidgetProperty | undefined;
      if (!widgetProperty || !widgetProperty.api.data_source_type) {
        console.warn(
          "Please set the Data Source Type in the widget properties."
        );
        return;
      }

      // Fetch data from CMS Data Visualizer Server
      if (
        widgetProperty.api.data_source_type === "cms_data_visualizer_server"
      ) {
        if (
          !widgetProperty.api.server_base_url ||
          !widgetProperty.api.server_api_key
        ) {
          console.warn(
            "Please set the Server Base URL and Server API Key in the widget properties."
          );
          return;
        }
        try {
          const url = `${widgetProperty.api.server_base_url}/items`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${widgetProperty.api.server_api_key}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          postMsg("addLayer", data.data.items || []);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else if (
        // Fetch data from CMS Integration API
        widgetProperty.api.data_source_type === "cms_integration_api"
      ) {
        if (
          !widgetProperty.api.integration_api_base_url ||
          !widgetProperty.api.integration_api_key ||
          !widgetProperty.api.cms_project_id ||
          !widgetProperty.api.cms_model_id
        ) {
          console.warn(
            "Please set the Integration API Base URL, Integration API Key, CMS Project ID, and CMS Model ID in the widget properties."
          );
          return;
        }

        // Fetch Assets with pagination
        let assets: Asset[];
        try {
          const baseUrl = `${widgetProperty.api.integration_api_base_url}/projects/${widgetProperty.api.cms_project_id}/assets`;
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${widgetProperty.api.integration_api_key}`,
          };
          // First request to get total count
          const firstResponse = await fetch(`${baseUrl}?perPage=100&page=1`, {
            method: "GET",
            headers,
          });

          if (!firstResponse.ok) {
            throw new Error(`HTTP error! status: ${firstResponse.status}`);
          }

          const firstData = await firstResponse.json();
          const totalCount = firstData.totalCount;
          const perPage = 100;
          const totalPages = Math.ceil(totalCount / perPage);

          assets = firstData.items || [];

          // Fetch remaining pages if there are more
          if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
              pagePromises.push(
                fetch(`${baseUrl}?perPage=${perPage}&page=${page}`, {
                  method: "GET",
                  headers,
                })
              );
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              assets = assets.concat(data.items || []);
            }
          }
          postMsg("setAssets", assets);
        } catch (error) {
          console.error("Error fetching assets:", error);
        }

        // Fetch Schema
        let schema: Schema;
        try {
          const url = `${widgetProperty.api.integration_api_base_url}/models/${widgetProperty.api.cms_model_id}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${widgetProperty.api.integration_api_key}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          schema = data.schema.fields;
        } catch (error) {
          console.error("Error fetching schema:", error);
        }

        // Fetch Items with pagination
        try {
          const baseUrl = `${widgetProperty.api.integration_api_base_url}/models/${widgetProperty.api.cms_model_id}/items`;
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${widgetProperty.api.integration_api_key}`,
          };

          // First request to get total count
          const firstResponse = await fetch(`${baseUrl}?perPage=100&page=1`, {
            method: "GET",
            headers,
          });

          if (!firstResponse.ok) {
            throw new Error(`HTTP error! status: ${firstResponse.status}`);
          }

          const firstData = await firstResponse.json();
          const totalCount = firstData.totalCount;
          const perPage = 100;
          const totalPages = Math.ceil(totalCount / perPage);

          let allItems: Item[] = firstData.items || [];

          // Fetch remaining pages if there are more
          if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
              pagePromises.push(
                fetch(`${baseUrl}?perPage=${perPage}&page=${page}`, {
                  method: "GET",
                  headers,
                })
              );
            }

            const responses = await Promise.all(pagePromises);

            for (const response of responses) {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              const data = await response.json();
              allItems = allItems.concat(data.items || []);
            }
          }

          // append schema's name to each item
          // replace asset id with asset url in each item
          allItems = allItems.map((item: Item) => ({
            ...item,
            fields: [
              ...item.fields.map((field: Field) => ({
                ...field,
                name: schema.find((s) => s.key === field.key)?.name,
                value:
                  field.type === "asset" && typeof field.value === "string"
                    ? assets.find((a) => a.id === field.value)?.url ||
                      field.value
                    : field.type === "asset" && Array.isArray(field.value)
                      ? (field.value as string[])
                          .map(
                            (assetId) =>
                              assets.find((a) => a.id === assetId)?.url ||
                              assetId
                          )
                          .reverse()
                      : field.value,
              })),
            ],
          }));

          // Apply value filters if any
          // Example: status===published|reviewed;category===news
          if (widgetProperty.api.value_filters) {
            const filters = widgetProperty.api.value_filters
              .split(";")
              .map((filter) => {
                const [key, values] = filter.split("===");
                return { key, values: values.split("|") };
              });

            allItems = allItems.filter((item) =>
              filters.every((filter) => {
                const field = item.fields.find((f) => f.key === filter.key);
                if (!field) return false;
                return filter.values.includes(String(field.value));
              })
            );
          }

          postMsg("addLayer", allItems);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
};
