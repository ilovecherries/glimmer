import type { RequestData } from "./RequestData";

export enum WebsocketResultType {
  Live = "live",
  Request = "request",
  UserlistUpdate = "userlistupdate",
  LastId = "lastId",
  Unexpected = "unexpected",
  BadToken = "badtoken",
}

export type WebsocketEvent = {
  action: string;
  data: string;
  id: number;
  refId: number;
  type: string;
  userId: number;
};

export type WebsocketMessage = {
  message?: RequestData;
};

export type StatusData = {
  [key: number]: string;
};

export type StatusDataContainer = {
  [key: number]: StatusData;
};

export type WebsocketData = {
  data: WebsocketMessage | RequestData;
  events?: Array<WebsocketEvent>;
  lastId?: number;
  optimized?: boolean;
  statuses?: StatusDataContainer;
};

export type WebsocketResult = {
  data: WebsocketData;
  error: null | string;
  requestUserId: number;
  type: WebsocketResultType;
  id?: string;
};
