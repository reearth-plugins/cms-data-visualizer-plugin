import html_main from "@distui/inspector_block/main/index.html?raw";

import { GlobalThis } from "@/shared/reearthTypes";

type UIMessage = {
  action: "getProperties";
};

const reearth = (globalThis as unknown as GlobalThis).reearth;
reearth.ui.show(html_main);

const sendProperties = () => {
  reearth.ui.postMessage({
    action: "getProperties",
    payload:
      reearth.layers.selectedFeature?.properties?.__original || undefined,
  });
};

reearth.layers.on("select", sendProperties);

reearth.extension.on("message", (message: unknown) => {
  const msg = message as UIMessage;

  if (msg.action === "getProperties") {
    sendProperties();
  }
});
