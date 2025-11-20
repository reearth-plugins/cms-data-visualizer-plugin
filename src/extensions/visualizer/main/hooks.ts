import { useEffect } from "react";

import { getItemsFromIntegrationAPI } from "./utils/getItemsFromIntegrationAPI";
import { getItemsFromPublicAPI } from "./utils/getItemsFromPublicAPI";
import { getItemsFromServer } from "./utils/getItemsFromServer";

import { postMsg } from "@/shared/utils";

type WidgetProperty = {
  api: {
    data_source_type?: "cms_data_visualizer_server" | "cms_integration_api";
    // for get items from server
    server_base_url?: string;
    server_api_key?: string;
    // for get items from integration API
    integration_api_base_url?: string;
    integration_api_key?: string;
    cms_workspace_id?: string;
    cms_project_id?: string;
    cms_model_id?: string;
    value_filters?: string;
    // for get items from public API
    public_api_base_url?: string;
    cms_workspace_id_for_public_api?: string;
    cms_project_id_for_public_api?: string;
    cms_model_id_for_public_api?: string;
    value_filters_for_public_api?: string;
  };
  appearance: {
    marker_appearance?: string;
  };
};

export type Item = {
  id: string;
  fields: Field[];
};

export type Field = {
  id: string;
  key: string;
  type: string;
  value: unknown;
  group?: string;
  name?: string;
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
          const items = await getItemsFromServer({
            baseUrl: widgetProperty.api.server_base_url,
            apiKey: widgetProperty.api.server_api_key,
          });
          postMsg("addLayer", items);
        } catch (error) {
          console.error("Error fetching data from server:", error);
        }
      } else if (
        // Fetch data from CMS Integration API
        widgetProperty.api.data_source_type === "cms_integration_api"
      ) {
        if (
          !widgetProperty.api.integration_api_base_url ||
          !widgetProperty.api.integration_api_key ||
          !widgetProperty.api.cms_workspace_id ||
          !widgetProperty.api.cms_project_id ||
          !widgetProperty.api.cms_model_id
        ) {
          console.warn(
            "Please set the Integration API Base URL, Integration API Key, CMS Workspace ID, CMS Project ID, and CMS Model ID in the widget properties."
          );
          return;
        }
        try {
          const items = await getItemsFromIntegrationAPI({
            baseUrl: widgetProperty.api.integration_api_base_url,
            apiKey: widgetProperty.api.integration_api_key,
            workspaceId: widgetProperty.api.cms_workspace_id,
            projectId: widgetProperty.api.cms_project_id,
            modelId: widgetProperty.api.cms_model_id,
            valueFilters: widgetProperty.api.value_filters,
          });
          postMsg("addLayer", items);
        } catch (error) {
          console.error("Error fetching data from CMS integration API:", error);
        }
      } else if (
        // Fetch data from CMS Public API
        widgetProperty.api.data_source_type === "cms_public_api"
      ) {
        if (
          !widgetProperty.api.public_api_base_url ||
          !widgetProperty.api.cms_workspace_id_for_public_api ||
          !widgetProperty.api.cms_project_id_for_public_api ||
          !widgetProperty.api.cms_model_id_for_public_api
        ) {
          console.warn(
            "Please set the Public API Base URL, CMS Workspace ID, CMS Project ID, and CMS Model ID in the widget properties."
          );
          return;
        }
        try {
          const items = await getItemsFromPublicAPI({
            baseUrl: widgetProperty.api.public_api_base_url,
            workspaceId: widgetProperty.api.cms_workspace_id_for_public_api,
            projectId: widgetProperty.api.cms_project_id_for_public_api,
            modelId: widgetProperty.api.cms_model_id_for_public_api,
            valueFilters: widgetProperty.api.value_filters_for_public_api,
          });
          postMsg("addLayer", items);
        } catch (error) {
          console.error("Error fetching data from CMS public API:", error);
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
