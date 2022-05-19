import { useWebsocketStore } from "@/stores/websocket";

import { useIdentityStore } from "../stores/identity";
import { API_DOMAIN } from "./qcs/qcs";
import type { Message } from "contentapi-ts-bindings/Views";
import HighlightJS from "highlight.js";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Markup_Render_Dom = require("../../markup2/render");
import { useStateStore } from "@/stores/state";
import type { SearchRequests } from "contentapi-ts-bindings/Search/SearchRequests";
import type { LiveEvent } from "contentapi-ts-bindings/Live/LiveEvent";
import type { SearchResult } from "contentapi-ts-bindings/Search/SearchResult";

export type RequestCallback = (
  data: Record<string, Record<string, object>>
) => void;

export const sendRequest = async (
  search: SearchRequests,
  callback: RequestCallback
) => {
  const identity = useIdentityStore();

  if (identity.loggedIn) {
    const ws = useWebsocketStore();
    ws.sendRequest(search, (a: LiveEvent) => {
      callback(a.data.objects);
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
): Promise<Message[]> => {
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
    const pageJson: Array<Message> = await pageReq.json();
    return pageJson;
  } else {
    throw new Error("You need to be logged in to rethread messages.");
  }
};

const Renderer = new Markup_Render_Dom();
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
