<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import { ref, watchEffect } from "@vue/runtime-dom";
import type { Notification } from "@/stores/shared";
import ActivityLogPane from "./sidebar/ActivityLogPane.vue";

const identity = useIdentityStore();
const shared = useSharedStore();
const settings = useSettingsStore();
const state = useStateStore();

const { loggedIn, username, avatar } = storeToRefs(identity);
const { login, logout } = identity;
const { contents, notifications } = storeToRefs(shared);
const { avatarSize, nickname } = storeToRefs(settings);
const { openSidebar } = storeToRefs(state);

let formUsername = "",
  formPassword = "";
let notificationsView = ref<Array<Notification>>([]);

function signIn(username: string, password: string) {
  login(username, password);
}

watchEffect(() => {
  if (notifications.value) {
    const notifs: Array<Notification> = Object.keys(notifications.value).map(
      (n: string) => notifications.value[parseInt(n)]
    );
    notifs.sort((a, b) => {
      const aDate = new Date(a.lastCommentDate);
      const bDate = new Date(b.lastCommentDate);
      if (aDate > bDate) return -1;
      else if (bDate > aDate) return 1;
      else return 0;
    });
    notificationsView.value = notifs;
  }
});
</script>

<template>
  <div v-show="openSidebar" class="sidebar grow w-full">
    <div class="flex flex-col h-full">
      <div v-if="loggedIn">
        <img
          :src="avatarUrl(avatar, avatarSize)"
          class="w-6 h-6"
          :alt="username + '\'s avatar'"
        />
        <span>Logged in as </span><b>{{ username }}</b>
        <button class="block" @click="logout()">Log out</button>
        <span>Nickname: </span><input type="text" v-model="nickname" />
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
      <div>
        <router-link
          v-for="n in notificationsView"
          :key="n.contentId"
          class="flex px-1 py-2 box-border"
          :to="`/page/${n.contentId}`"
        >
          <div class="grow">
            <!-- <img
              :src="
                avatarUrl(contents[n.contentId].data.values?.thumbnail || '')
              "
              alt=""
            /> -->
            {{ contents[n.contentId].data.name }}
          </div>
          <div v-if="n.count">
            {{ n.count }}
          </div>
        </router-link>
      </div>
      <div class="h-4 bg-slate-600"></div>
      <div class="grow overflow-y-scroll">
        <ActivityLogPane />
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
  border-bottom: 1px black solid;
}
</style>
