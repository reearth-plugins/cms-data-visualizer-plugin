import { useEffect } from "react";

import { postMsg } from "@/shared/utils";

type WidgetProperty = {
  api: {
    data_source_type?: "cms_data_visualizer_server" | "cms_integration_api";
    server_base_url?: string;
    server_api_key?: string;
    integration_api_base_url?: string;
    integration_api_key?: string;
    cms_model_id?: string;
  };
  appearance: {
    marker_appearance?: string;
  };
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
          !widgetProperty.api.cms_model_id
        ) {
          console.warn(
            "Please set the Integration API Base URL, Integration API Key, and CMS Model ID in the widget properties."
          );
          return;
        }
        // Fetch Schema
        let schema;
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
          console.log(schema);
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

          let allItems = firstData.items || [];

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
