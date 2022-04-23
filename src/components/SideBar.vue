<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useStateStore } from "@/stores/state";
import NotificationPane from "@/components/sidebar/NotificationPane.vue";
import ProfilePage from "./sidebar/ProfilePage.vue";
import { ref } from "@vue/runtime-dom";
import SearchPane from "./sidebar/SearchPane.vue";

const state = useStateStore();
const { openSidebar } = storeToRefs(state);

let sidebarView = ref(0);
</script>

<template>
  <div v-show="openSidebar" class="sidebar shrink-0 grow md:w-100">
    <div class="flex flex-col h-full bg-sbPattern bg-repeat">
      <NotificationPane v-show="sidebarView === 0" />
      <SearchPane v-show="sidebarView === 1" />
      <ProfilePage v-show="sidebarView === 2" />
      <div class="h-8 flex bg-white">
        <div
          :class="`sidebar-button-container ${
            sidebarView === 0 ? 'bg-slate-500' : 'bg-white'
          }`"
          @click="sidebarView = 0"
        >
          <div class="text-l">🏠</div>
        </div>
        <div
          :class="`sidebar-button-container ${
            sidebarView === 1 ? 'bg-slate-500' : 'bg-white'
          }`"
          @click="sidebarView = 1"
        >
          <div class="text-l">🔎</div>
        </div>
        <div
          :class="`sidebar-button-container ${
            sidebarView === 2 ? 'bg-slate-500' : 'bg-white'
          }`"
          @click="sidebarView = 2"
        >
          <div class="text-l">ME</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.sidebar {
  width: 30em;
}

.activity-bar {
  line-height: 1.5em;
  min-height: 1.5em;
  height: 1.5em;
  border-bottom: 1px black solid;
}
</style>
