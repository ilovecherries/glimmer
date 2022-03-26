import { API_DOMAIN } from "@/lib/qcs/qcs";
import type { RequestData } from "@/lib/qcs/types/RequestData";
import type { RequestParameter } from "@/lib/qcs/types/RequestParameter";
import type { WebsocketRequest } from "@/lib/qcs/types/WebsocketRequest";
import {
  WebsocketResultType,
  type WebsocketResult,
} from "@/lib/qcs/types/WebsocketResult";
import { BroadcastChannel, createLeaderElection } from "broadcast-channel";
import { defineStore } from "pinia";
import { useSharedStore } from "./shared";
import { uniqueIdGen } from "./state";

const channel = new BroadcastChannel("glimmer-ws");
const elector = createLeaderElection(channel);

export type ListenerFunc = (a: WebsocketResult) => void;

export type WebsocketStoreState = {
  lastId: undefined | number;
  websocket: undefined | WebSocket;
  errorHandler: undefined | ListenerFunc;
  requestIds: Array<string>;
  requestResults: Map<string, any>;
  ready: boolean;
};

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
      requestIds: [],
      ready: false,
      requestResults: new Map(),
    } as WebsocketStoreState;
  },
  actions: {
    start(token: string) {
      console.log("websocket start trigger!");
      elector.awaitLeadership().then(() => {
        console.log("LEADERSHIP TAKEN!");
        if (this.websocket) return;
        this.websocket = getWebSocket(token, this.lastId);

        const shared = useSharedStore();

        this.websocket.onmessage = (event) => {
          try {
            const res = JSON.parse(event.data) as WebsocketResult;

            console.log(res);

            switch (res.type) {
              case WebsocketResultType.Live: {
                if (res.data.lastId) this.lastId = res.data.lastId;
                const data = res.data.data.message as RequestData;
                data.user?.map((x) => {
                  shared.users[x.id] = x;
                });
                data.message?.map((x) => {
                  shared.addComment(x);
                });
                break;
              }
              // eslint-disable-next-line no-fallthrough
              case WebsocketResultType.UserlistUpdate: {
                const data = res.data;
                (data.data as RequestData).user?.map((x) => {
                  shared.users[x.id] = x;
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
                this.requestResults.set(res.id!, res.data);
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
    makeRequest(search: RequestParameter, callback: (a: any) => void) {
      if (!this.websocket)
        throw new Error("The websocket isn't running, cannot make request.");
      let id = "";
      // do {
      id = String(Math.random()).substring(2);
      // } while (this.requestIds.findIndex((x) => x === id) === -1);
      console.log(id);
      this.requestIds.push(id);
      const data: WebsocketRequest = {
        type: "request",
        data: search,
        id: id,
      };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.websocket!.send(JSON.stringify(data));
      setTimeout(() => {
        console.log(this.requestResults);
        if (this.requestResults.has(id)) {
          const res = this.requestResults.get(id);
          this.requestResults.delete(id);
          this.requestIds = this.requestIds.filter((x) => x !== id);
          callback(res);
        }
      }, 1000);
    },
    stop() {
      this.websocket?.close();
      this.websocket = undefined;
    },
    setErrorHandler(func: ListenerFunc) {
      this.errorHandler = func;
    },
    whenReady(func: () => void) {
      if (this.websocket) {
        const x = () => {
          if (this.ready) func();
          else setTimeout(x, 20);
        };
        x();
      }
    },
    updateMyStatus() {
      this.whenReady(() => {
        const shared = useSharedStore();

        if (this.websocket) {
          const req: WebsocketRequest = {
            type: "setuserstatus",
            data: shared.myStatuses,
            id: uniqueIdGen(),
          };
          this.websocket.send(JSON.stringify(req));
        }
      });
    },
    setStatus(room: number, status = "active") {
      const shared = useSharedStore();

      shared.myStatuses[room] = status;

      this.updateMyStatus();
    },
    removeStatus(room: number) {
      const shared = useSharedStore();

      delete shared.myStatuses[room];

      this.updateMyStatus();
    },
  },
});
