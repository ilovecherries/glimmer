<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";

const identity = useIdentityStore();
const shared = useSharedStore();
const settings = useSettingsStore();
const state = useStateStore();

const { loggedIn, username, avatar } = storeToRefs(identity);
const { login, logout } = identity;
const { comments, users } = storeToRefs(shared);
const { avatarSize } = storeToRefs(settings);
const { openSidebar } = storeToRefs(state);

let formUsername = "",
  formPassword = "";

function signIn(username: string, password: string) {
  login(username, password);
}
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
          <div v-for="c in comments" :key="c.id">
            <img
              :src="avatarUrl(users[c.createUserId].avatar, avatarSize)"
              alt="Avatar"
              class="w-6 h-6 p-1 inline"
            />
            <div class="inline">{{ users[c.createUserId].username }}:</div>
            <div class="inline">{{ c.text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.sidebar {
  flex: 1 0 1;
  width: 30em;
}
</style>
