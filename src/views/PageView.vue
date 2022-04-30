<script setup lang="ts">
import { BasicPageDisplaySearch } from "@/lib/qcs/qcs";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useIdentityStore } from "@/stores/identity";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import { ContentState, useSharedStore } from "@/stores/shared";
import { RoomStatus, useWebsocketStore } from "@/stores/websocket";
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import ChatView from "../components/ChatView.vue";
import type { RequestData } from "@/lib/qcs/types/RequestData";
import { render, sendRequest } from "@/lib/helpers";
import MarkupRender from "../../node_modules/markup2/MarkupRender.vue";

const identity = useIdentityStore();
const state = useStateStore();
const settings = useSettingsStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();

const { headerText } = storeToRefs(state);

const { avatarSize, titleNotifications } = storeToRefs(settings);
const { commentChunks, contents, users, notifications } = storeToRefs(shared);
const { loggedIn } = storeToRefs(identity);
let showChat = ref(true);

const props = defineProps({
  id: String,
});

let oldPage: undefined | number = undefined;

function changeFavicon(link: string) {
  let $favicon: HTMLLinkElement | null =
    document.querySelector('link[rel="icon"]');
  // If a <link rel="icon"> element already exists,
  // change its href to the given link.
  if ($favicon !== null) {
    $favicon.href = link;
    // Otherwise, create a new element and append it to <head>.
  } else {
    $favicon = document.createElement("link");
    $favicon.rel = "icon";
    $favicon.href = link;
    document.head.appendChild($favicon);
  }
}

const clearNotif = () => {
  if (shared.messageInitialLoad) {
    if (props.id && shared.notifications[parseInt(props.id)]) {
      shared.notifications[parseInt(props.id)].count = 0;
    }
  } else setTimeout(clearNotif, 20);
};

watch(
  () => props.id,
  async () => {
    if (props.id) {
      const id = parseInt(props.id);
      nextTick(() => {
        if (oldPage && oldPage !== id) {
          console.log(`${oldPage} -> ${id}`);
          websocket.setStatus(oldPage, RoomStatus.notPresent);
          websocket.setStatus(id);
          oldPage = id;
        } else if (!oldPage) {
          websocket.setStatus(id);
          oldPage = id;
        }
      });
      if (
        contents.value[id] &&
        contents.value[id].state === ContentState.full
      ) {
        const page = contents.value[id].data;
        headerText.value = page.name;
        clearNotif();
        return;
      }
      try {
        const search = BasicPageDisplaySearch(id);
        const pageAction = (data: RequestData) => {
          const page = data.content?.shift();
          if (page) {
            headerText.value = page.name;
            contents.value[id] = {
              data: page,
              state: ContentState.full,
            };
            const users = data.user;
            users?.map(shared.addUser);
            const messages = data.message;
            if (messages) {
              messages.map(shared.addComment);
              shared.sortComments();
              shared.rebuildCommentChunks(id);
              shared.rebuildActivityChunks();
            }
            clearNotif();
          } else {
            throw new Error("Page wasn't returned from the API.");
          }
        };
        sendRequest(search, pageAction);
      } catch (err) {
        console.error(err);
      }
    }
  },
  { immediate: true }
);

watch(
  commentChunks,
  () => {
    if (props.id) {
      const current = commentChunks.value[parseInt(props.id)];
      if (current) {
        const last = current[current.length - 1];
        if (last) {
          const lastComment = last.comments[last.comments.length - 1];
          if (lastComment) {
            if (titleNotifications.value) {
              document.title = lastComment.text;
              changeFavicon(
                avatarUrl(
                  lastComment.values?.a ||
                    users.value[lastComment.createUserId].avatar,
                  avatarSize.value
                )
              );
            }
          }
        }
      }
    }
  },
  { deep: true }
);

watch(
  notifications,
  () => {
    clearNotif();
  },
  { deep: true }
);
</script>

<template>
  <main class="h-full flex">
    <div v-show="!showChat" class="grow p-2 flex flex-col w-full">
      <div class="text-2xl font-bold">
        {{ contents[parseInt(props.id!)]?.data?.name || "Unknown" }}
      </div>
      <div class="min-h-max">
        <MarkupRender
          :content="contents[parseInt(props.id!)]?.data?.text || '...'"
          :lang="contents[parseInt(props.id!)]?.data?.values?.markupLang"
          :render="render"
        />
      </div>
    </div>
    <ChatView
      :contentId="parseInt(props.id!)"
      :showChatBox="loggedIn"
      :showUserlist="loggedIn"
      v-show="showChat"
    />
  </main>
</template>

<style>
</style>
