import { useWebsocketStore } from "@/stores/websocket";

import { useIdentityStore } from "../stores/identity";
import type { Message } from "contentapi-ts-bindings/Views";
import HighlightJS from "highlight.js/lib/core";
import Markup_Render_Dom from "markup2/render";
import { useStateStore } from "@/stores/state";
import type { SearchRequests } from "contentapi-ts-bindings/Search/SearchRequests";
import type { LiveEvent } from "contentapi-ts-bindings/Live/LiveEvent";
import type { LiveData } from "contentapi-ts-bindings/Live/LiveData";
import { api } from "@/lib/qcs";
import { getPageRequest } from "contentapi-ts-bindings/Helpers";
import type { GetPageResult } from "contentapi-ts-bindings/Helpers";
import { ContentState, useSharedStore } from "@/stores/shared";
import { generateChatChunks } from "@/lib/chunks";

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import lua from "highlight.js/lib/languages/lua";
import ruby from "highlight.js/lib/languages/ruby";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import haskell from "highlight.js/lib/languages/haskell";
import powershell from "highlight.js/lib/languages/powershell";
import csharp from "highlight.js/lib/languages/csharp";
import x86asm from "highlight.js/lib/languages/x86asm";
import { smilebasic } from "./smilebasic";

HighlightJS.registerLanguage("javascript", javascript);
HighlightJS.registerLanguage("typescript", typescript);
HighlightJS.registerLanguage("css", css);
HighlightJS.registerLanguage("rust", rust);
HighlightJS.registerLanguage("sql", sql);
HighlightJS.registerLanguage("json", json);
HighlightJS.registerLanguage("xml", xml);
HighlightJS.registerLanguage("html", xml); // fuck you
HighlightJS.registerLanguage("lua", lua);
HighlightJS.registerLanguage("ruby", ruby);
HighlightJS.registerLanguage("ruby", ruby);
HighlightJS.registerLanguage("c", c);
HighlightJS.registerLanguage("cpp", cpp);
HighlightJS.registerLanguage("csharp", csharp);
HighlightJS.registerLanguage("haskell", haskell);
HighlightJS.registerLanguage("powershell", powershell);
HighlightJS.registerLanguage("x86asm", x86asm);
HighlightJS.registerLanguage("smilebasic", smilebasic);
HighlightJS.registerLanguage("sb", smilebasic);

export const sendRequest = <T = Record<string, Array<object>>>(
  search: SearchRequests
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const identity = useIdentityStore();

    if (identity.loggedIn) {
      const ws = useWebsocketStore();
      ws.sendRequest(search, (a: LiveEvent) => {
        resolve((a.data as unknown as LiveData<T>).objects);
      });
    } else {
      api.request<T>(search).then((x) => resolve(x.objects));
    }
  });
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
    const pageReq = await fetch(`${api.path}/Shortcuts/rethread`, {
      method: "POST",
      headers: identity.headers,
      body: JSON.stringify(params),
    });
    const pageJson: Array<Message> = await pageReq.json();
    return pageJson;
  } else {
    throw new Error("You need to be logged in to rethread messages.");
  }
};

const Renderer = new Markup_Render_Dom();

Renderer.create["code"] = ({ text, lang }): HTMLPreElement => {
  const e = document.createElement("pre");
  e.textContent = text;
  e.className += `language-${lang}`;
  HighlightJS.highlightElement(e);
  return e;
};

const oldImgCreate = Renderer.create["image"];
Renderer.create["image"] = (props): HTMLImageElement => {
  const e = oldImgCreate(props) as HTMLImageElement;
  e.addEventListener("click", () => {
    const state = useStateStore();
    state.imageView = {
      url: e.src,
      show: true,
    };
  });
  return e;
};

export function last<T>(arr: Array<T> | undefined): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr[arr.length - 1];
}

export const render = Renderer.render;

export const loadPage = async (id: number, callback: () => void) => {
  const shared = useSharedStore();
  if (shared.contents[id] && shared.contents[id].state === ContentState.full) {
    callback();
  }

  const search = getPageRequest(id, { messagePage: 0 });
  const pageAction = (data: GetPageResult) => {
    const page = data.content?.shift();
    if (page) {
      shared.addContent(page, ContentState.full);
      data.user?.map(shared.addUser);
      console.log("CHAT CHUNKS", generateChatChunks(data.message?.reverse() || [], data.user || []));
      const messages = data.message;
      if (messages) {
        messages.map(shared.addComment);
        shared.sortComments();
        shared.rebuildCommentChunks(id);
        shared.rebuildActivityChunks();
      }
      callback();
    } else {
      throw new Error("Page wasn't returned from the API.");
    }
  };
  await sendRequest<GetPageResult>(search).then(pageAction);
};
