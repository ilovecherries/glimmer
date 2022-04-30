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
import { useStateStore } from "@/stores/state";

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
const URL_SCHEME = {
  "sbs:"(url: URL) {
    return "#" + url.pathname + url.search + url.hash;
  },
  "no-scheme:"(url: URL) {
    url.protocol = "https:";
    return url.href;
  },
  "javascript:"(url: URL) {
    return "about:blank";
  },
};
function filter_url(url: string) {
  try {
    let u = new URL(url, "no-scheme:/");
    let f = URL_SCHEME[u.protocol];
    return f ? f(u) : u.href;
  } catch (e) {
    return "about:blank";
  }
}

Renderer.create["code"] = ({ text, lang }): HTMLPreElement => {
  const e = document.createElement("pre");
  e.textContent = text;
  e.className += `language-${lang}`;
  HighlightJS.highlightElement(e);
  return e;
};

Renderer.create["image"] = ({ url, alt, width, height }): HTMLImageElement => {
  const e = document.createElement("img");
  e.addEventListener("click", () => {
    const state = useStateStore();
    state.imageView = {
      url: e.src,
      show: true,
    };
  });
  e.src = filter_url(url);
  e.onerror = e.onload = e.removeAttribute.bind(e, "data-loading");
  if (alt != null) e.alt = alt;
  if (width) e.width = width;
  if (height) e.height = height;
  return e;
};

export function last<T>(arr: Array<T> | undefined): T | undefined {
  if (!arr) return undefined;
  return arr[arr.length - 1];
}

export const render = Renderer.render;
