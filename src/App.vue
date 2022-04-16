<script setup lang="ts">
import { RouterView } from "vue-router";
import SideBar from "@/components/SideBar.vue";
import { useIdentityStore } from "./stores/identity";
import { useWebsocketStore } from "./stores/websocket";
import { watch, watchEffect } from "vue";
import { useStateStore } from "./stores/state";
import { storeToRefs } from "pinia";

const identity = useIdentityStore();
const state = useStateStore();

const { headerText, openSidebar, imageView } = storeToRefs(state);

const { loggedIn, token } = storeToRefs(identity);

const ws = useWebsocketStore();
const { websocket } = storeToRefs(ws);

function manageWS() {
  if (loggedIn.value && !websocket.value) ws.start(token.value);
  if (!loggedIn.value && websocket.value) ws.stop();
}

watch(loggedIn, async () => {
  manageWS();
});

watchEffect(() => {
  manageWS();
});
</script>

<template>
  <div class="h-full relative">
    <div class="h-full flex flex-col dark dark:bg-slate-900">
      <header class="flex">
        <div>
          <img
            src="./assets/glimmer_scaled.png"
            alt="Starlight Glimmer's Cutiemark"
            class="px-2 w-8 h-auto"
          />
        </div>
        <div>
          <h1 class="text-xl py-1 white">{{ headerText }}</h1>
        </div>
        <button
          @click="state.openSidebar = !state.openSidebar"
          class="bg-slate-300"
        >
          Toggle Sidebar
        </button>
      </header>
      <div class="flex w-full grow">
        <div
          :class="`h-full grow ${openSidebar ? 'hidden' : 'block'} md:block`"
        >
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
          class="p-1 bg-slate-100 max-w-fit bottom-0 left-0 absolute"
        >
          {{ imageView?.url || "" }}
        </a>
      </div>
    </div>
  </div>
</template>

<style>
@import "./assets/output.css";
header {
  background: gray;
}

.flex > *,
.flex-row > * {
  flex-shrink: 0;
}
main,
.grow {
  flex: 1 1 0;
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
