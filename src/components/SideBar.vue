<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStateStore } from "@/stores/state";
import NotificationPane from "@/components/sidebar/NotificationPane.vue";
import ProfilePage from "./sidebar/ProfilePage.vue";
import { ref } from "@vue/runtime-dom";
import SearchPane from "./sidebar/SearchPane.vue";
import { useIdentityStore } from "@/stores/identity";

const state = useStateStore();
const identity = useIdentityStore();
const { openSidebar } = storeToRefs(state);

const NOTIFICATION_PANE = 0;
const SEARCH_PANE = 1;
const PROFILE_PANE = 2;

let sidebarView = ref(identity.session ?
  NOTIFICATION_PANE :
  PROFILE_PANE);
</script>

<template>
  <div v-show="openSidebar" class="shrink-0 grow relative border-bcol border-l">
    <!-- <img
      :src="Splash"
      alt="Starlight Glimmer Splash"
      class="absolute bottom-0 right-0 w-[12em] h-auto opacity-25"
    /> -->
    <div
      class="absolute bottom-0 right-0 w-[var(--splash-size)] h-[var(--splash-size)] opacity-[var(--splash-opacity)] bg-sidebar-splash bg-contain"
    ></div>
    <div class="flex flex-col h-full sidebar-content relative">
      <NotificationPane v-show="sidebarView === 0" />
      <SearchPane v-show="sidebarView === 1" />
      <ProfilePage v-show="sidebarView === 2" />
      <div class="h-8 flex bg-white">
        <div
          :class="`sidebar-button-container ${
            sidebarView === 0 ? 'bg-accent-2' : 'bg-accent'
          }`"
          @click="sidebarView = 0"
        >
          <div class="text-l">🏠</div>
        </div>
        <div
          :class="`sidebar-button-container ${
            sidebarView === 1 ? 'bg-accent-2' : 'bg-accent'
          }`"
          @click="sidebarView = 1"
        >
          <div class="text-l">🔎</div>
        </div>
        <div
          :class="`sidebar-button-container ${
            sidebarView === 2 ? 'bg-accent-2' : 'bg-accent'
          }`"
          @click="sidebarView = 2"
        >
          <div class="text-l">ME</div>
        </div>
      </div>
    </div>
  </div>
</template>
