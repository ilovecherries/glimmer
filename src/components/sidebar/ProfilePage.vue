<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { storeToRefs } from "pinia";
import { useSettingsStore, THEMES } from "@/stores/settings";
import { api } from "@/lib/qcs";

const identity = useIdentityStore();
const settings = useSettingsStore();

const { login, logout } = identity;
const { session, user } = storeToRefs(identity);
const { avatarSize, nickname, theme } = storeToRefs(settings);

function signIn(username: string, password: string) {
  login(username, password);
}

const domain = import.meta.env.VITE_API_DOMAIN;

let formUsername = "",
  formPassword = "";
</script>

<template>
  <div class="grow">
    <div v-if="session">
      <img
        :src="user?.avatar ? api.getFileURL(user.avatar, avatarSize) : ''"
        class="w-6 h-6"
        :alt="user?.username + '\'s avatar'"
      />
      <span>Logged in as </span><b>{{ user?.username || "Unknown" }}</b> (uid:
      {{ user?.id }})
      <div>Server: {{ domain }}</div>
      <div>Super?: {{ user?.super }}</div>
      <div>Create date: {{ user?.createDate }}</div>
      <button class="block" @click="logout()">Log out</button>
      <div><span>Nickname: </span><input type="text" v-model="nickname" /></div>
    </div>
    <div v-else>
      <h2 class="text-2xl">{{ domain }}</h2>
      <form
        class="flex flex-col gap-2 max-w-min"
        @submit.prevent="signIn(formUsername, formPassword)"
      >
        <div>
          <label class="block text-lg" for="login-username">Username:</label>
          <input
            v-model="formUsername"
            id="login-username"
            type="text"
            name="username"
            required
          />
        </div>
        <div>
          <label for="login-password" class="block text-lg"> Password: </label>
          <input
            v-model="formPassword"
            id="login-password"
            type="password"
            name="password"
            required
          />
        </div>
        <button type="submit">Log in</button>
      </form>
    </div>
    <hr class="my-4" />
    <div>
      <span class="pr-4">theme:</span>
      <select
        v-model="theme"
        class="text-textColor bg-document border-bcol border-2 rounded"
      >
        <option v-for="(t, index) in THEMES" :value="t" :key="index">
          {{ t }}
        </option>
      </select>
    </div>
  </div>
</template>
