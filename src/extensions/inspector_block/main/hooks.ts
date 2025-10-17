import { useEffect, useState } from "react";

import { postMsg } from "@/shared/utils";

export type Field = {
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
};

export default () => {
  const [properties, setProperties] = useState<Field[] | null>(null);

  useEffect(() => {
    postMsg("getProperties");
  }, []);

  const handleMessage = (e: MessageEvent) => {
    if (e.data.action === "getProperties") {
      setProperties(e.data.payload);
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return {
    properties,
  };
};
