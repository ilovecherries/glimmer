<script setup lang="ts">
import { RouterView } from "vue-router";
import SideBar from "@/components/SideBar.vue";
import { useIdentityStore } from "./stores/identity";
import { useWebsocketStore } from "./stores/websocket";
import { watch } from "vue";
import { useStateStore } from "./stores/state";
import { storeToRefs } from "pinia";
import { ContentState, useSharedStore } from "./stores/shared";
import { GetSearchBackDate } from "@/lib/qcs";
import { sendRequest } from "./lib/helpers";
import { useSettingsStore } from "./stores/settings";
import {
  SearchRequest,
  SearchRequests,
} from "contentapi-ts-bindings/Search/SearchRequests";
import type {
  Content,
  MessageAggregate,
  User,
} from "contentapi-ts-bindings/Views";
import { RequestType } from "contentapi-ts-bindings/Search/RequestType";

const identity = useIdentityStore();
const state = useStateStore();
const shared = useSharedStore();
const settings = useSettingsStore();

const { headerText, openSidebar, imageView } = storeToRefs(state);

const { session } = storeToRefs(identity);
const { messageInitialLoad } = storeToRefs(shared);
const { theme } = storeToRefs(settings);

const ws = useWebsocketStore();
const { socket } = storeToRefs(ws);

function manageWS() {
  if (session?.value && !socket?.value) ws.start(session.value);
  if (!session?.value && socket?.value) ws.stop();
}

watch(
  () => session?.value,
  async () => {
    manageWS();
  },
  { immediate: true }
);

watch(
  [messageInitialLoad],
  () => {
    if (shared && !messageInitialLoad.value) {
      const search = new SearchRequests(
        {
          yesterday: GetSearchBackDate(24),
        },
        [
          new SearchRequest(
            RequestType.message_aggregate,
            "contentId,count,maxId,minId,createUserId,maxCreateDate",
            "createDate > @yesterday"
          ),
          new SearchRequest(
            RequestType.content,
            "id,values,keywords,votes,text,commentCount,name,createUserId",
            "id in @message_aggregate.contentId"
          ),
          new SearchRequest(
            RequestType.user,
            "*",
            "id in @content.createUserId"
          ),
        ]
      );
      console.log("🏄 Getting initial Message Aggregate to populate activity");
      sendRequest(search, (data) => {
        const shared = useSharedStore();
        data.content?.map((x) =>
          shared.addContent(x as Content, ContentState.partial)
        );
        data.user?.map((x) => shared.addUser(x as User));
        data.message_aggregate?.map((x) => {
          const m = x as MessageAggregate;
          const id = m.contentId;
          if (!shared.notifications[id])
            shared.notifications[id] = {
              contentId: id,
              lastCommentDate: m.maxCreateDate,
              count: m.count,
            };
          else {
            const lastDate = shared.notifications[id].lastCommentDate;
            if (new Date(lastDate) < new Date(m.maxCreateDate)) {
              shared.notifications[id].lastCommentDate = m.maxCreateDate;
            }
            shared.notifications[id].count += m.count;
          }
        });
        shared.messageInitialLoad = true;
      });
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="h-full relative bg-document text-textColor" :data-theme="theme">
    <div class="h-full flex flex-col dark dark:bg-slate-900">
      <header class="flex h-7 bg-accent-2">
        <div class="grow">
          <img
            src="./assets/glimmer_scaled.png"
            alt="Starlight Glimmer's Cutiemark"
            class="px-2 py-1 w-6 h-auto inline"
          />
          <h1 class="text-xl py-auto px-1 text-accent-text inline">
            {{ headerText }}
          </h1>
        </div>
        <div class="h-full flex">
          <div
            v-if="session"
            :class="`h-2 w-2 mx-3 my-auto rounded-full ${
              socket ? 'bg-green-400' : 'bg-red-600'
            }`"
            title="WebSocket Status"
          ></div>
        </div>
        <button
          @click="state.openSidebar = !state.openSidebar"
          class="bg-accent hover:bg-item-hover shrink-0 w-6 h-5 my-auto mx-1 px-1"
        >
          =
        </button>
      </header>
      <div
        :class="`grid grid-cols-1 ${
          openSidebar ? 'md:grid-cols-[6fr_2fr]' : ''
        } w-full grow`"
      >
        <div :class="`h-full ${openSidebar ? 'hidden' : 'block'} md:block`">
          <RouterView />
        </div>
        <SideBar />
      </div>
      <div
        :class="`absolute top-0 left-0 flex flex-col image-view image-view-${
          imageView?.show ? 'visible' : 'hidden'
        }`"
        @click="imageView!.show = false"
      >
        <div class="m-auto max-h-fit max-w-fit p-2">
          <img
            :src="imageView?.url || ''"
            alt=""
            :class="`image-view image-view-${
              imageView?.show ? 'visible' : 'hidden'
            }`"
          />
        </div>
        <a
          v-show="imageView?.show"
          :href="imageView?.url || ''"
          target="_blank"
          class="p-1 bg-accent-2 max-w-fit text-accent-text bottom-0 left-0 absolute"
        >
          {{ imageView?.url || "" }}
        </a>
      </div>
    </div>
  </div>
</template>

<style>
@import "./input.css";
@import "./code.css";
header {
  background: gray;
}

.flex > *,
.flex-row > * {
  flex-shrink: 0;
}
/* main, */
.grow {
  flex: 1 1 0;
  /* min-height: 0; /* i don't understand this either */
  /* overflow: auto; */
  min-width: 0;
}

.grow-0 {
  flex: 0 1 0;
  /* min-height: 0; /* i don't understand this either */
  /* overflow: auto; */
  min-width: 0;
}

img.image-view {
  max-height: 80vh;
  max-width: 80vw;
}

div.image-view-hidden {
  transition: background-color 0.2s, width 0.2s steps(1, end),
    height 0.2s steps(1, end);
  width: 0%;
  height: 0%;
  background-color: rgba(0, 0, 0, 0);
}

div.image-view-visible {
  transition: background-color 0.2s;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
}

img.image-view-hidden {
  max-height: 0px;
  min-height: 0px;
  transition: transform 0.2s, opacity 0.2s, max-height 0.2s steps(1, end),
    min-height 0.2s steps(1, end);
  opacity: 0;
  transform: scale(0.8);
}

img.image-view-visible {
  transition: transform 0.2s, opacity 0.2s;
  opacity: 1;
  transform: scale(1);
}
</style>
