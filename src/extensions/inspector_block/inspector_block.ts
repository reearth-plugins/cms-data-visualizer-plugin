import html_main from "@distui/inspector_block/main/index.html?raw";

import { GlobalThis } from "@/shared/reearthTypes";

type UIMessage = {
  action: "getInspector";
};

const reearth = (globalThis as unknown as GlobalThis).reearth;
reearth.ui.show(html_main);

const sendInspector = () => {
  reearth.ui.postMessage({
    action: "getInspector",
    payload:
      reearth.layers.selectedFeature?.properties?.__inspector || undefined,
  });
};

reearth.layers.on("select", sendInspector);

reearth.extension.on("message", (message: unknown) => {
  const msg = message as UIMessage;

  if (msg.action === "getInspector") {
    sendInspector();
  }
});
