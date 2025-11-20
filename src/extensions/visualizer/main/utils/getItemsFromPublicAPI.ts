import { Field, Item } from "../hooks";

type PropertyObject = Record<string, unknown | Record<string, unknown>>;

type PublicModelResponse = {
  results: PropertyObject[];
  totalCount: number;
};

type SchemaProperty = {
  title: string;
  type: string;
  format?: string;
  items?: {
    properties: Record<string, SchemaProperty>;
  };
};

type Schema = {
  properties: Record<string, SchemaProperty>;
};

export const getItemsFromPublicAPI = async ({
  baseUrl,
  workspaceId,
  projectId,
  modelId,
  valueFilters,
  fieldTypeOverrides,
}: {
  baseUrl: string;
  workspaceId: string;
  projectId: string;
  modelId: string;
  valueFilters?: string;
  fieldTypeOverrides?: string;
}): Promise<Item[]> => {
  const url = `${baseUrl}/p/${workspaceId}/${projectId}/${modelId}`;

  const items: Item[] = [];
  let schema: Schema | null = null;
  let data: PublicModelResponse | null = null;

  // Get public model schema
  try {
    const schemaResponse = await fetch(`${url}.schema.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!schemaResponse.ok) {
      throw new Error(`HTTP error! status: ${schemaResponse.status}`);
    }

    schema = (await schemaResponse.json()) as Schema;
  } catch (error) {
    console.error("Error fetching schema from Public API:", error);
  }

  // Get public model data
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = (await response.json()) as PublicModelResponse;
  } catch (error) {
    console.error("Error fetching data from Public API:", error);
  }

  if (!data || !schema) {
    return items;
  }

  const flatSchemaProperties: Record<string, SchemaProperty> = {};

  // Flatten schema properties
  const flattenProperties = (properties: Record<string, SchemaProperty>) => {
    for (const [key, prop] of Object.entries(properties)) {
      if (prop.items) {
        flatSchemaProperties[key] = {
          title: prop.title,
          type: "group",
        };
        flattenProperties(prop.items.properties);
      } else {
        flatSchemaProperties[key] = {
          ...prop,
          type:
            prop.type === "string" && prop.format === "binary"
              ? "asset"
              : prop.type,
        };
      }
    }
  };

  flattenProperties(schema.properties);

  // Field type overrides
  const typeOverrides: Record<string, string> = {};
  if (fieldTypeOverrides) {
    const overrides = fieldTypeOverrides.split(",");
    for (const override of overrides) {
      const [fieldKey, fieldType] = override.split(":");
      if (fieldKey && fieldType) {
        typeOverrides[fieldKey] = fieldType;
      }
    }
  }

  // Process properties
  const processProperties = (
    properties: PropertyObject,
    item: Item,
    groupId?: string
  ) => {
    for (const [key, value] of Object.entries(properties)) {
      if (key === "id") {
        if (!groupId && value) {
          item.id = value as string;
        }
      } else {
        const fieldId = Math.random().toString(36).substring(2, 9);

        // check if it is a group
        const type = typeOverrides[key] || flatSchemaProperties[key]?.type;

        const field: Field = {
          id: fieldId,
          key,
          value:
            type === "group"
              ? fieldId
              : type === "asset"
                ? Array.isArray(value)
                  ? value.map((v) => v.url)
                  : value
                : value,
          type,
          name: flatSchemaProperties[key]?.title || key,
        };

        if (groupId) field.group = groupId;

        item.fields.push(field);

        if (type === "group") {
          processProperties(value as Record<string, unknown>, item, fieldId);
        }
      }
    }
  };

  // Convert data results to items
  for (const itemData of data.results) {
    const item: Item = { id: "", fields: [] };
    processProperties(itemData, item);
    items.push(item);
  }

  // Apply value filters if any
  // Example: status===published|reviewed;category===news
  let filteredItems = items;
  if (valueFilters) {
    const filters = valueFilters.split(";").map((filter) => {
      const [key, values] = filter.split("===");
      return { key, values: values.split("|") };
    });

    filteredItems = items.filter((item) =>
      filters.every((filter) => {
        const field = item.fields.find((f) => f.key === filter.key);
        if (!field) return false;
        return filter.values.includes(String(field.value));
      })
    );
  }

  return filteredItems;
};
