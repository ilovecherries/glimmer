import type { RequestData } from "./RequestData";
import type { RequestParameter } from "./RequestParameter";

export type SearchResult = {
  objects: RequestData;
  search: RequestParameter;
};
