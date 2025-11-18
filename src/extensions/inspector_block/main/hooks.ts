import { useEffect, useState } from "react";

import { postMsg } from "@/shared/utils";

export type Property = {
  id: string;
  key: string;
  type: string;
  value:
    | string
    | number
    | boolean
    | undefined
    | string[]
    | number[]
    | boolean[];
  name: string;
  hideTitle?: boolean;
  children?: Property[];
};

export type Inspector = {
  title?: string;
  properties: Property[];
};

export default () => {
  const [inspector, setInspector] = useState<Inspector | null>(null);

  useEffect(() => {
    postMsg("getInspector");
  }, []);

  const handleMessage = (e: MessageEvent) => {
    if (e.data.action === "getInspector") {
      setInspector(e.data.payload);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return {
    inspector,
  };
};
