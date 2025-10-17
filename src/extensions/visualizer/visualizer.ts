import html_main from "@distui/visualizer/main/index.html?raw";

import { GlobalThis } from "@/shared/reearthTypes";

type VisualizationConfig = {
  location_type?: "lng_lat_fields" | "lng_lat_array_field" | "geojson_field";
  latitude_field_key?: string;
  longitude_field_key?: string;
  longitude_latitude_array_field_key?: string;
  geojson_field_key?: string;
  infobox_fields?: string;
  marker_appearance?: string;
};

type WidgetProperty = {
  // ignore tha api group
  visualization: VisualizationConfig;
};

type Item = {
  id: string;
  fields: {
    id: string;
    key: string;
    type: string;
    value: unknown;
  }[];
};

type UIMessage =
  | {
      action: "init";
    }
  | {
      action: "addLayer";
      payload: Item[];
    };

const reearth = (globalThis as unknown as GlobalThis).reearth;
reearth.ui.show(html_main);

let markerAppearance = {};
try {
  markerAppearance = JSON.parse(
    (reearth.extension?.widget?.property as WidgetProperty)?.visualization
      ?.marker_appearance || "{}"
  );
} catch (error) {
  console.error("Failed to parse marker appearance:", error);
}

reearth.extension.on("message", (message: unknown) => {
  const msg = message as UIMessage;

  if (msg.action === "init") {
    reearth.ui.postMessage({
      action: "init",
      payload: reearth.extension?.widget?.property,
    });
  } else if (msg.action === "addLayer") {
    const items = msg.payload;
    const geoJSON = generateGeoJSON(
      items,
      (reearth.extension?.widget?.property as WidgetProperty)?.visualization
    );

    reearth.layers.add({
      type: "simple",
      data: {
        type: "geojson",
        value: geoJSON,
      },
      marker: {
        ...markerAppearance,
      },
      infobox: {
        blocks: [
          {
            pluginId: "reearth",
            extensionId: "inspector_block",
          },
        ],
      },
    });
  }
});

const generateGeoJSON = (
  items: Item[],
  config: VisualizationConfig | undefined
) => {
  if (!config || !config.location_type) {
    console.warn("Visualization configuration is missing or incomplete.");
    return null;
  }

  // Check location parameters
  if (config.location_type === "lng_lat_fields") {
    if (!config.latitude_field_key || !config.longitude_field_key) {
      console.warn(
        "Please set the Longitude Field Key and Latitude Field Key in the visualization configuration."
      );
      return null;
    }
  } else if (config.location_type === "lng_lat_array_field") {
    if (!config.longitude_latitude_array_field_key) {
      console.warn(
        "Please set the Longitude & Latitude Array Field Key in the visualization configuration."
      );
      return null;
    }
  } else if (config.location_type === "geojson_field") {
    if (!config.geojson_field_key) {
      console.warn(
        "Please set the GeoJSON Field Key in the visualization configuration."
      );
      return null;
    }
  }

  // Convert items to GeoJSON features
  const fields = config.infobox_fields
    ? config.infobox_fields.split(",").map((f) => f.trim())
    : [];

  const features = items
    .map((item) => {
      // Prepare properties
      const properties: Record<string, any> = {};

      if (fields.length === 0) {
        // If no infobox fields specified, include all fields
        item.fields.forEach((field) => {
          properties[field.key] = field.value;
        });
        properties.__original = item.fields;
      } else {
        properties.__original = [];
        fields.forEach((field) => {
          const fieldObj = item.fields.find((f) => f.key === field);
          if (fieldObj) {
            properties[field] = fieldObj.value;
            properties.__original.push(fieldObj);
          }
        });
      }

      // Get location
      const coordinates = [];
      if (config.location_type === "lng_lat_fields") {
        const lat = item.fields.find(
          (f) => f.key === config.latitude_field_key
        )?.value;
        const lng = item.fields.find(
          (f) => f.key === config.longitude_field_key
        )?.value;

        if (lat === undefined || lng === undefined) {
          return null;
        }

        coordinates.push(lng, lat);
      } else if (config.location_type === "lng_lat_array_field") {
        const latLngArray = item.fields.find(
          (f) => f.key === config.longitude_latitude_array_field_key
        )?.value;
        if (!Array.isArray(latLngArray) || latLngArray.length < 2) {
          console.warn(
            `Invalid Longitude & Latitude array for item ${item.id}`
          );
          return null;
        }
        coordinates.push(latLngArray[0], latLngArray[1]);
      } else if (config.location_type === "geojson_field") {
        try {
          const geojson = item.fields.find(
            (f) => f.key === config.geojson_field_key
          )?.value;

          if (!geojson) {
            console.warn(`GeoJSON field is missing for item ${item.id}`);
            return null;
          }

          // Parse GeoJSON string and get coordinates
          if (typeof geojson === "string") {
            const geojsonObj = JSON.parse(geojson);
            if (
              geojsonObj.type === "Point" &&
              Array.isArray(geojsonObj.coordinates)
            ) {
              coordinates.push(...geojsonObj.coordinates);
            } else {
              console.warn(
                `Unsupported GeoJSON type or invalid coordinates for item ${item.id}`
              );
              return null;
            }
          } else if (typeof geojson === "object" && geojson !== null) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const geojsonObj = geojson as any;
            if (
              geojsonObj.type === "Point" &&
              Array.isArray(geojsonObj.coordinates)
            ) {
              coordinates.push(...geojsonObj.coordinates);
            } else {
              console.warn(
                `Unsupported GeoJSON type or invalid coordinates for item ${item.id}`
              );
              return null;
            }
          } else {
            console.warn(
              `GeoJSON field is not a valid string or object for item ${item.id}`
            );
            return null;
          }
        } catch (e) {
          console.warn(`Error parsing GeoJSON for item ${item.id}: ${e}`);
          return null;
        }
      }

      if (coordinates.length === 0) {
        console.warn(`No valid coordinates found for item ${item.id}`);
        return null;
      }

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates,
        },
        properties,
      };
    })
    .filter((f) => f !== null);

  const geoJSON = {
    type: "FeatureCollection",
    features: features,
  };

  return geoJSON;
};
