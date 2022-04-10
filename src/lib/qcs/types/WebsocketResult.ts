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
  none = "none",
  message = "message_event",
  activity = "activity_event",
  watch = "watch_event",
  uservariable = "uservariable_event",
  user = "user_event",
  userlist = "userlist_event",
  messageAggregate = "message_aggregate_event",
}

export type WebsocketEvent = {
  action: WebsocketEventAction;
  data: string;
  id: number;
  refId: number;
  type: WebsocketEventType;
  userId: number;
};

export interface WebsocketMessage extends RequestData {
  message_event: RequestData;
}

export type StatusData = {
  [key: number]: string;
};

export type StatusDataContainer = {
  [key: number]: StatusData;
};

export type WebsocketData = {
  objects: WebsocketMessage;
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
