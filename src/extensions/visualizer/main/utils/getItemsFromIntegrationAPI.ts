import { Field, Item } from "../hooks";

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

export const getItemsFromIntegrationAPI = async ({
  baseUrl,
  apiKey,
  workspaceId,
  projectId,
  modelId,
  valueFilters,
}: {
  baseUrl: string;
  apiKey: string;
  workspaceId: string;
  projectId: string;
  modelId: string;
  valueFilters?: string;
}): Promise<Item[]> => {
  let allItems: Item[] = [];

  // Fetch Assets with pagination
  let assets: Asset[];
  try {
    const apiBaseUrl = `${baseUrl}/${workspaceId}/projects/${projectId}/assets`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    // First request to get total count
    const firstResponse = await fetch(`${apiBaseUrl}?perPage=100&page=1`, {
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
          fetch(`${apiBaseUrl}?perPage=${perPage}&page=${page}`, {
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
  } catch (error) {
    console.error("Error fetching assets:", error);
  }

  // Fetch Schema
  let schema: Schema;
  try {
    const url = `${baseUrl}/${workspaceId}/projects/${projectId}/models/${modelId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
    const apiBaseUrl = `${baseUrl}/${workspaceId}/projects/${projectId}/models/${modelId}/items`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // First request to get total count
    const firstResponse = await fetch(`${apiBaseUrl}?perPage=100&page=1`, {
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

    allItems = firstData.items || [];

    // Fetch remaining pages if there are more
    if (totalPages > 1) {
      const pagePromises = [];
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          fetch(`${apiBaseUrl}?perPage=${perPage}&page=${page}`, {
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
              ? assets.find((a) => a.id === field.value)?.url || field.value
              : field.type === "asset" && Array.isArray(field.value)
                ? (field.value as string[])
                    .map(
                      (assetId) =>
                        assets.find((a) => a.id === assetId)?.url || assetId
                    )
                    .reverse()
                : field.value,
        })),
      ],
    }));

    // Apply value filters if any
    // Example: status===published|reviewed;category===news
    if (valueFilters) {
      const filters = valueFilters.split(";").map((filter) => {
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
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  return allItems;
};
