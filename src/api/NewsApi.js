import { httpCore } from "./http";

export async function fetchNews(params = {}) {
  const { data } = await httpCore.get("/news", { params });
  return data;
}
