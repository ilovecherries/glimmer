import { useWebsocketStore } from "@/stores/websocket";
import type { RequestParameter } from "./qcs/types/RequestParameter";

import { useIdentityStore } from "../stores/identity";
import type { WebsocketResult } from "./qcs/types/WebsocketResult";
import type { RequestData } from "./qcs/types/RequestData";
import type { SearchResult } from "./qcs/types/SearchResult";
import { API_DOMAIN } from "./qcs/qcs";
import type { Comment } from "./qcs/types/Comment";
import HighlightJS from "highlight.js";
import { Markup_Render_Html } from "markup2/render";

export type RequestCallback = (data: RequestData) => void;

export const sendRequest = async (
  search: RequestParameter,
  callback: RequestCallback
) => {
  const identity = useIdentityStore();

  if (identity.loggedIn) {
    const ws = useWebsocketStore();
    ws.sendRequest(search, (a: WebsocketResult) => {
      callback(a.data.objects as RequestData);
    });
  } else {
    const pageReq = await fetch(`https://${API_DOMAIN}/api/Request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(search),
    });
    const pageJson: SearchResult = await pageReq.json();
    callback(pageJson.objects);
  }
};

export const rethreadMessages = async (
  messageIds: number[],
  contentId: number
): Promise<Comment[]> => {
  const identity = useIdentityStore();
  if (identity.loggedIn) {
    const params = {
      messageIds,
      contentId,
      message: `Rethreaded messages to ${contentId}`,
    };
    const pageReq = await fetch(
      `https://${API_DOMAIN}/api/Shortcuts/rethread`,
      {
        method: "POST",
        headers: identity.headers,
        body: JSON.stringify(params),
      }
    );
    const pageJson: Array<Comment> = await pageReq.json();
    return pageJson;
  } else {
    throw new Error("You need to be logged in to rethread messages.");
  }
};

const Renderer = new Markup_Render_Html();
Renderer.create["code"] = ({ text, lang }): HTMLPreElement => {
  const e = document.createElement("pre");
  e.textContent = text;
  e.className += `language-${lang}`;
  HighlightJS.highlightElement(e);
  return e;
};

export const render = Renderer.render;
