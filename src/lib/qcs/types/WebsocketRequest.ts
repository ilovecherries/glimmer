import type { RequestParameter } from "./RequestParameter";

export type WebsocketRequest = {
  type: string;
  data: RequestParameter | any;
  id: string;
};
