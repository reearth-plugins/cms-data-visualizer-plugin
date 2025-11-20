import { Item } from "../hooks";

export const getItemsFromServer = async ({
  baseUrl,
  apiKey,
}: {
  baseUrl: string;
  apiKey: string;
}): Promise<Item[]> => {
  const url = `${baseUrl}/items`;
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
  return data.data?.items || [];
};
