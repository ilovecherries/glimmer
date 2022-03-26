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

const { headerText } = storeToRefs(state);

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
  <div class="h-full flex flex-col">
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
      <RouterView />
      <SideBar />
    </div>
  </div>
</template>

<style>
@import "./assets/output.css";
#app {
  height: inherit;
}

body {
  height: 100vh;
  padding: 0;
  /* overflow: hidden; */
}

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
</style>
