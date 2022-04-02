<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import MarkupRender from "./MarkupRender.vue";
import { nextTick, onUpdated, ref, watch, watchEffect } from "@vue/runtime-dom";

const identity = useIdentityStore();
const shared = useSharedStore();
const settings = useSettingsStore();
const state = useStateStore();

const { loggedIn, username, avatar } = storeToRefs(identity);
const { login, logout } = identity;
const { contents, activityChunks, users } = storeToRefs(shared);
const { avatarSize, activityDisplayUsername } = storeToRefs(settings);
const { openSidebar } = storeToRefs(state);

let formUsername = "",
  formPassword = "";
let $scrollToBottom = ref<HTMLDivElement | null>(null);

function signIn(username: string, password: string) {
  login(username, password);
}

function scroll() {
  nextTick(() => {
    if ($scrollToBottom.value) {
      $scrollToBottom.value.scrollIntoView({
        block: "end",
      });
    }
  });
}

onUpdated(() => {
  scroll();
});
</script>

<template>
  <div :class="`sidebar ${openSidebar ? '' : 'hidden'}`">
    <div class="flex flex-col h-full">
      <div v-if="loggedIn">
        <img
          :src="avatarUrl(avatar, avatarSize)"
          class="w-6 h-6"
          :alt="username + '\'s avatar'"
        />
        <span>Logged in as </span><b>{{ username }}</b>
        <button class="block" @click="logout()">Log out</button>
      </div>
      <div v-else>
        <div>
          <label for="username">Username:</label>
          <input v-model="formUsername" type="text" name="username" />
        </div>
        <div>
          <label for="password">Password:</label>
          <input v-model="formPassword" type="password" name="password" />
        </div>
        <button @click="signIn(formUsername, formPassword)">Log in</button>
      </div>
      <hr />
      <div class="grow overflow-y-scroll">
        <div>
          <div v-for="a in activityChunks" :key="a.id">
            <div class="text-xl activity-bar">
              <router-link :to="`/page/${a.contentId}`">
                {{ contents[a.contentId].name }}
              </router-link>
            </div>
            <div
              v-for="c in a.comments"
              class="flex activity-bar overflow-hidden whitespace-pre text-ellipsis"
              :key="c.id"
            >
              <img
                :src="avatarUrl(users[c.createUserId].avatar, avatarSize)"
                :alt="`${users[c.createUserId].username}'s avatar`"
                class="w-6 h-6 p-1 inline"
                :title="users[c.createUserId].username"
              />
              <div class="inline" v-if="activityDisplayUsername">
                {{ users[c.createUserId].username }}:
              </div>
              <div class="grow inline">{{ c.text }}</div>
            </div>
          </div>
        </div>
        <div ref="$scrollToBottom"></div>
      </div>
    </div>
  </div>
</template>

<style>
.sidebar {
  flex: 1 0 1;
  width: 30em;
}

.activity-bar {
  line-height: 1.5em;
  min-height: 1.5em;
  height: 1.5em;
  border-bottom: 1px black solid;;
}
</style>
