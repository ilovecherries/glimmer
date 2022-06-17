<script setup="setup" lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import { useSharedStore } from "@/stores/shared";
import { useWebsocketStore } from "@/stores/websocket";
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import ChatView from "../components/ChatView.vue";
import { loadPage, render } from "@/lib/helpers";
import MarkupRender from "@/components/MarkupRender.vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router";
import { Status } from "contentapi-ts-bindings/Helpers";
import { api } from "@/lib/qcs";

const identity = useIdentityStore();
const state = useStateStore();
const settings = useSettingsStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();
const route = useRoute();

const { headerText } = storeToRefs(state);

const { avatarSize, titleNotifications } = storeToRefs(settings);
const { commentChunks, contents, users, notifications } = storeToRefs(shared);
const { loggedIn } = storeToRefs(identity);
let showChat = ref(true);
const PAGE_NOT_FOUND = -1;
let contentId = ref(PAGE_NOT_FOUND);

const props = defineProps({
  id: String,
});

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

const removeOldStatus = () => {
  if (contentId.value !== PAGE_NOT_FOUND) {
    websocket.setStatus(contentId.value, Status.not_present);
  }
};

onBeforeRouteLeave(removeOldStatus);
onBeforeRouteUpdate(removeOldStatus);

watch(
  () => route.params.id,
  (param) => {
    if (param !== undefined) {
      const id = parseInt(param as string);
      loadPage(id, () => {
        contentId.value = id;
        headerText.value = contents.value[id].data.name;
        clearNotif();
        nextTick(() => {
          websocket.setStatus(id, Status.active);
        });
      }).catch(() => {
        contentId.value = -1;
      });
    }
  },
  { immediate: true }
);

watch(
  () => commentChunks.value[contentId.value],
  (current) => {
    if (current) {
      const last = current[current.length - 1];
      if (last) {
        const lastComment = last.comments[last.comments.length - 1];
        if (lastComment) {
          if (titleNotifications.value) {
            document.title = lastComment.text;
            changeFavicon(
              api.getFileURL(
                lastComment.values?.a ||
                  users.value[lastComment.createUserId].avatar,
                avatarSize.value
              )
            );
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
  <main class="h-full">
    <div class="h-full flex flex-col" v-if="contentId !== PAGE_NOT_FOUND">
      <div
        v-show="!showChat"
        class="grow p-2 flex flex-col w-full overflow-scroll h-full"
      >
        <div class="text-2xl">
          <span class="font-bold">
            {{ contents[contentId]?.data?.name || "Unknown" }}
          </span>
          <span>
            [<router-link :to="`/edit-page/${props.id!}`">Edit</router-link>]
          </span>
        </div>
        <div class="min-h-max">
          <MarkupRender
            :content="contents[contentId]?.data?.text || '...'"
            :lang="contents[contentId]?.data?.values?.markupLang"
            :render="render"
          />
        </div>
      </div>
      <div
        class="shrink-0 bg-bcol h-4 md:h-2 md:hover:h-6 hover:cursor-pointer"
        @click="showChat = !showChat"
      ></div>
      <ChatView
        :contentId="contentId"
        :showChatBox="loggedIn"
        :showUserlist="loggedIn"
        v-show="showChat"
      />
    </div>
    <div v-else>COULD NOT FIND PAGE FROM API</div>
  </main>
</template>
