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

  const handleMessage = (e: MessageEvent) => {
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
        const url = `${widgetProperty.api.server_base_url}/items`;
        fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${widgetProperty.api.server_api_key}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            postMsg("addLayer", data.data.items || []);
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
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
        const url = `${widgetProperty.api.integration_api_base_url}/models/${widgetProperty.api.cms_model_id}/items?perPage=10000`;
        fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${widgetProperty.api.integration_api_key}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            postMsg("addLayer", data.items || []);
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
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
