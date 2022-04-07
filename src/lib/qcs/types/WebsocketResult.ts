import type { RequestData } from "./RequestData";

export enum WebsocketResultType {
  Live = "live",
  Request = "request",
  UserlistUpdate = "userlistupdate",
  LastId = "lastId",
  Unexpected = "unexpected",
  BadToken = "badtoken",
}

export enum WebsocketEventAction {
  create = 1,
  read = 2,
  update = 4,
  delete = 8,
}

export enum WebsocketEventType {
  none = 0,
  message = 1,
  activity = 2,
  watch = 3,
  uservariable = 4,
  user = 5,
  userlist = 6,
}

export type WebsocketEvent = {
  action: WebsocketEventAction;
  data: string;
  id: number;
  refId: number;
  type: WebsocketEventType;
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
