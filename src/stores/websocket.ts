import { UserAction } from "contentapi-ts-bindings/Enums";
import {
  Status,
  type ContentAPI_Session,
  type ContentAPI_Socket,
  type ContentAPI_Socket_Function,
} from "contentapi-ts-bindings/Helpers";
import { LiveEventType } from "contentapi-ts-bindings/Live/LiveEvent";
import { WebSocketResponseType } from "contentapi-ts-bindings/Live/WebSocketResponse";
import type { Content, Message, User } from "contentapi-ts-bindings/Views";
import { defineStore } from "pinia";
import { ContentState, useSharedStore } from "./shared";
import type { UserlistResult } from "contentapi-ts-bindings/Live/UserlistResult";
import type { SearchRequests } from "contentapi-ts-bindings/Search/SearchRequests";

export type WebsocketStoreState = {
  socket?: ContentAPI_Socket;
};

export const useWebsocketStore = defineStore({
  id: "websocket",
  state: () => {
    return {
      socket: undefined,
    } as WebsocketStoreState;
  },
  actions: {
    start(session: ContentAPI_Session) {
      console.log("💤 Checking WebSocket status");
      if (!session) {
        return;
      }
      if (this.socket) {
        return;
      }
      this.socket = session.createSocket();
      console.log("👑 WebSocket Started");

      const shared = useSharedStore();

      this.setStatus(0);

      this.socket.callback = (res) => {
        try {
          console.log("📦️ Received Message", res);

          switch (res.type) {
            case LiveEventType.live: {
              const data = res.data.objects[WebSocketResponseType.message];
              data.content?.map((x) => {
                const c = x as Content;
                if (shared.contents[c.id]) {
                  Object.assign(shared.contents[c.id].data, x);
                } else {
                  shared.contents[c.id] = {
                    data: c,
                    state: ContentState.partial,
                  };
                }
              });
              data.user?.map((x) => shared.addUser(x as User));

              const events = res.data.events;
              events?.map((e) => {
                if (e.type === WebSocketResponseType.message) {
                  const x = data.message?.find(
                    (x) => (x as Message).id === e.refId
                  ) as Message;
                  if (x) {
                    switch (e.action) {
                      case UserAction.create:
                        shared.addComment(x);
                        break;
                      case UserAction.delete:
                        shared.deleteComment(x);
                        break;
                      case UserAction.update:
                        shared.editComment(x);
                        break;
                    }
                  }
                }
              });
              break;
            }
            case LiveEventType.userlistupdate: {
              const data = res.data as unknown as UserlistResult;
              data.objects.content?.map((x) => {
                const c = x as Content;
                console.log(c);
                if (shared.contents[c.id]) {
                  Object.assign(shared.contents[c.id], x);
                } else {
                  shared.contents[c.id] = {
                    data: c,
                    state: ContentState.partial,
                  };
                }
              });
              data.objects.user?.map((x) => {
                const u = x as User;
                shared.users[u.id] = u;
              });
              if (data.statuses) {
                Object.entries(data.statuses).map(([x, y]) => {
                  shared.userlists[parseInt(x)] = y;
                });
              }
              break;
            }
            case LiveEventType.badtoken:
            case LiveEventType.unexpected:
              break;
            default:
              console.warn("This event type for websockets isn't tracked yet!");
          }
        } catch (err) {
          console.error(err);
        }
      };
    },
    sendRequest(data: SearchRequests, callback: ContentAPI_Socket_Function) {
      this.socket?.sendRequest(data, callback);
    },
    stop() {
      this.socket?.socket.close();
      this.socket = undefined;
    },
    whenReady(func: () => void) {
      this.socket?.whenReady(func);
    },
    setStatus(room: number, status = Status.active) {
      this.socket?.setStatus(room, status);
    },
  },
});
