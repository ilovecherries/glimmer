import { API_DOMAIN, GetSearchBackDate } from "@/lib/qcs/qcs";
import type { RequestData } from "@/lib/qcs/types/RequestData";
import { RequestParameter } from "@/lib/qcs/types/RequestParameter";
import { RequestSearchParameter } from "@/lib/qcs/types/RequestSearchParameter";
import type { WebsocketRequest } from "@/lib/qcs/types/WebsocketRequest";
import {
  WebsocketEventAction,
  WebsocketEventType,
  WebsocketResultType,
  type StatusData,
  type WebsocketResult,
} from "@/lib/qcs/types/WebsocketResult";
import { BroadcastChannel, createLeaderElection } from "broadcast-channel";
import { defineStore } from "pinia";
import { ContentState, useSharedStore } from "./shared";
import { uniqueIdGen, useStateStore } from "./state";

const channel = new BroadcastChannel("glimmer-ws");
const elector = createLeaderElection(channel);

export type ListenerFunc = (a: WebsocketResult) => void;

enum LeaderStatus {
  unknown,
  confirmed,
  not,
}

export type WebsocketStoreState = {
  lastId: undefined | number;
  websocket: undefined | WebSocket;
  errorHandler: undefined | ListenerFunc;
  requests: Map<string, ListenerFunc>;
  requestResults: Map<string, any>;
  leader: LeaderStatus;
  ready: boolean;
};

export enum RoomStatus {
  active = "active",
  notPresent = "",
}

function getWebSocket(token: string, lastId?: number): WebSocket {
  const params = new URLSearchParams();
  params.set("token", token);
  if (lastId) params.set("lastId", lastId.toString());
  return new WebSocket(`wss://${API_DOMAIN}/api/live/ws?${params.toString()}`);
}

export const useWebsocketStore = defineStore({
  id: "websocket",
  state: () => {
    return {
      lastId: undefined,
      websocket: undefined,
      errorHandler: undefined,
      requests: new Map(),
      leader: LeaderStatus.unknown,
      ready: false,
    } as WebsocketStoreState;
  },
  actions: {
    start(token: string) {
      console.log("websocket start trigger!");
      setTimeout(() => {
        if (this.leader === LeaderStatus.unknown)
          this.leader = LeaderStatus.not;
      }, 10000);
      elector.awaitLeadership().then(() => {
        console.log("LEADERSHIP TAKEN!");
        this.leader = LeaderStatus.confirmed;
        if (this.websocket) return;
        this.websocket = getWebSocket(token, this.lastId);

        const shared = useSharedStore();
        const state = useStateStore();

        if (!shared.messageInitialLoad) {
          const search = new RequestParameter(
            {
              yesterday: GetSearchBackDate(24),
            },
            [
              new RequestSearchParameter(
                "message_aggregate",
                "contentId,count,maxId,minId,createUserId,maxCreateDate",
                "createDate > @yesterday"
              ),
              new RequestSearchParameter(
                "content",
                "~values,keywords,votes,text,commentCount",
                "id in @message_aggregate.contentId"
              ),
            ]
          );
          this.sendRequest(search, (res) => {
            console.log("MESSAGE AGGREGATE", res);
            const data = res.data.objects;
            data.content?.map((x) => {
              if (shared.contents[x.id])
                Object.assign(shared.contents[x.id], x);
              else {
                shared.contents[x.id] = {
                  data: x,
                  state: ContentState.partial,
                };
              }
            });
            data.message_aggregate?.map((x) => {
              const id = x.contentId;
              if (!shared.notifications[id])
                shared.notifications[id] = {
                  contentId: id,
                  lastCommentDate: x.maxCreateDate,
                  count: x.count,
                };
              else {
                const lastDate = shared.notifications[id].lastCommentDate;
                if (new Date(lastDate) < new Date(x.maxCreateDate)) {
                  shared.notifications[id].lastCommentDate = x.maxCreateDate;
                }
                shared.notifications[id].count += x.count;
              }
            });
            shared.messageInitialLoad = true;
          });
        }

        this.websocket.onclose = () => {
          this.start(token);
        };

        this.websocket.onmessage = (event) => {
          try {
            const res = JSON.parse(event.data) as WebsocketResult;

            console.log(res);

            switch (res.type) {
              case WebsocketResultType.Live: {
                if (res.data.lastId) this.lastId = res.data.lastId;
                const data = res.data.objects.message_event;
                data.content?.map((x) => {
                  if (shared.contents[x.id])
                    Object.assign(shared.contents[x.id].data, x);
                  else {
                    shared.contents[x.id] = {
                      data: x,
                      state: ContentState.partial,
                    };
                  }
                });
                data.user?.map((x) => shared.addUser(x));

                const events = res.data.events;
                events?.map((e) => {
                  if (e.type === WebsocketEventType.message) {
                    const x = data.message?.find((x) => x.id === e.refId);
                    if (x)
                      switch (e.action) {
                        case WebsocketEventAction.create:
                          shared.addComment(x);
                          break;
                        case WebsocketEventAction.delete:
                          shared.deleteComment(x);
                          break;
                        case WebsocketEventAction.update:
                          shared.editComment(x);
                          break;
                      }
                  }
                });
                break;
              }
              // eslint-disable-next-line no-fallthrough
              case WebsocketResultType.UserlistUpdate: {
                const data = res.data;
                (data.objects as RequestData).content?.map((x) => {
                  if (shared.contents[x.id])
                    Object.assign(shared.contents[x.id], x);
                  else {
                    shared.contents[x.id] = {
                      data: x,
                      state: ContentState.partial,
                    };
                  }
                });
                (data.objects as RequestData).user?.map((x) => {
                  if (shared.users[x.id]) Object.assign(shared.users[x.id], x);
                  else shared.users[x.id] = x;
                });
                if (data.statuses) {
                  Object.entries(data.statuses).map(([x, y]) => {
                    shared.userlists[parseInt(x)] = y;
                  });
                }
                console.log("uwu");
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                break;
              }
              case WebsocketResultType.BadToken:
              case WebsocketResultType.Unexpected:
                if (this.errorHandler) this.errorHandler(res);
                break;
              case WebsocketResultType.Request:
                shared.wsResultStore[res.id!] = res;
                break;
              case WebsocketResultType.LastId:
                this.ready = true;
                break;
              default:
                console.warn(
                  "This event type for websockets isn't tracked yet!"
                );
            }
          } catch (err) {
            console.error(err);
          }
        };
      });
    },
    sendRequest(data: any, callback: ListenerFunc) {
      this.whenReady(() => {
        const id = uniqueIdGen();
        const req = {
          id,
          data,
          type: "request",
        } as WebsocketRequest;
        const shared = useSharedStore();
        const x = () => {
          const data = shared.getRequestData(id);
          if (data) callback(data);
          else setTimeout(x, 30);
        };
        this.websocket!.send(JSON.stringify(req));
        setTimeout(x, 30);
      });
    },
    stop() {
      this.websocket?.close();
      this.websocket = undefined;
    },
    setErrorHandler(func: ListenerFunc) {
      this.errorHandler = func;
    },
    whenReady(func: () => void) {
      if (
        this.leader === LeaderStatus.unknown ||
        this.leader === LeaderStatus.confirmed
      ) {
        const x = () => {
          if (this.ready) func();
          else setTimeout(x, 20);
        };
        x();
      }
    },
    setStatus(room: number, status = RoomStatus.active) {
      const data: StatusData = {};
      data[room] = status;

      this.whenReady(() => {
        if (this.websocket) {
          const req: WebsocketRequest = {
            type: "setuserstatus",
            data,
            id: uniqueIdGen(),
          };
          this.websocket.send(JSON.stringify(req));
        }
      });
    },
  },
});
