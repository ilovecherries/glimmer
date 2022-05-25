import { useWebsocketStore } from "@/stores/websocket";

import { useIdentityStore } from "../stores/identity";
import type { Message } from "contentapi-ts-bindings/Views";
import HighlightJS from "highlight.js";
import Markup_Render_Dom from "markup2/render";
import { useStateStore } from "@/stores/state";
import type { SearchRequests } from "contentapi-ts-bindings/Search/SearchRequests";
import type { LiveEvent } from "contentapi-ts-bindings/Live/LiveEvent";
import type { LiveData } from "contentapi-ts-bindings/Live/LiveData";
import { api } from "@/lib/qcs";
import { getPageRequest } from "contentapi-ts-bindings/Helpers";
import type { GetPageResult } from "contentapi-ts-bindings/Helpers";
import { ContentState, useSharedStore } from "@/stores/shared";
import { nextTick } from "vue";

export const sendRequest = async <T = Record<string, Array<object>>>(
  search: SearchRequests,
  callback: (data: T) => void
) => {
  const identity = useIdentityStore();

  if (identity.loggedIn) {
    const ws = useWebsocketStore();
    ws.sendRequest(search, (a: LiveEvent) => {
      callback((a.data as unknown as LiveData<T>).objects);
    });
  } else {
    const data = await api.request<T>(search);
    callback(data.objects);
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
      `https://${import.meta.env.VITE_API_DOMAIN}/api/Shortcuts/rethread`,
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

export const loadPage = async (id: number): Promise<void> => {
  const shared = useSharedStore();
  if (
    shared.contents[id] &&
    shared.contents[id].state === ContentState.full
  ) {
    return;
  }

  const search = getPageRequest(id, { messagePage: 0 });
  const pageAction = (data: GetPageResult) => {
    const page = data.content?.shift();
    if (page) {
      shared.addContent(page, ContentState.full);
      data.user?.map(shared.addUser);
      const messages = data.message;
      if (messages) {
        messages.map(shared.addComment);
        shared.sortComments();
        shared.rebuildCommentChunks(id);
        shared.rebuildActivityChunks();
      }
    } else {
      throw new Error("Page wasn't returned from the API.");
    }
  };
  return sendRequest<GetPageResult>(search, pageAction);
}