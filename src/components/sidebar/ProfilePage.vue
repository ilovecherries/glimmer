<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { storeToRefs } from "pinia";
import { useSettingsStore, THEMES } from "@/stores/settings";
import { api } from "@/lib/qcs";
import { useWebsocketStore } from "@/stores/websocket";
import { MARKUPS } from "contentapi-ts-bindings/dist/Views/Extras/MarkupLanguage";
import type { User } from "contentapi-ts-bindings/dist/Views";
import { useSharedStore } from "@/stores/shared";

const identity = useIdentityStore();
const settings = useSettingsStore();
const websocket = useWebsocketStore();
const shared = useSharedStore();

const { login, logout } = identity;
const { session, user } = storeToRefs(identity);
const { avatarSize, nickname, theme, markup } = storeToRefs(settings);
const { start: startWS, stop: stopWS } = websocket;

let newAvatarHash = "";

function signIn(username: string, password: string) {
  login(username, password);
}

const domain = import.meta.env.VITE_API_DOMAIN;

async function restartSocket() {
  stopWS();
  if (identity.session) {
    startWS(identity.session);
  }
}

async function changeAvatar(hash: string) {
  const params: Partial<User> = {
    ...identity.user,
    avatar: hash,
  };
  const user = (await session?.value?.write("user", params)) as User;
  shared.addUser(user);
}

let loginUsername = "",
  formPassword = "",
  registerUsername = "",
  registerEmail = "",
  registerPassword = "";
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
      <div>
        <span>Avatar: </span><input type="text" v-model="newAvatarHash" />
        <button @click="changeAvatar(newAvatarHash)">Change</button>
      </div>
      <button class="block" @click="restartSocket()">Restart WebSocket</button>
    </div>
    <div v-else class="p-2">
      <h2 class="text-xl">Welcome to ContentAPI</h2>
      <h2 class="text-l">Server: {{ domain }}</h2>
      <hr />
      <h3 class="text-xl">Login</h3>
      <form @submit.prevent="signIn(loginUsername, formPassword)">
        <div>
          <label class="block" for="login-username">Username</label>
          <input
            v-model="loginUsername"
            id="login-username"
            type="text"
            name="username"
            required
          />
        </div>
        <div>
          <label for="login-password" class="block">Password</label>
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
      <h3 class="text-xl">Register</h3>
      <form @submit.prevent="signIn(registerUsername, registerPassword)">
        <div>
          <label class="block" for="register-username">Username</label>
          <input
            v-model="registerUsername"
            id="register-username"
            type="text"
            name="username"
            required
          />
        </div>
        <div>
          <label class="block" for="register-email">Email</label>
          <input
            v-model="registerEmail"
            id="register-email"
            type="text"
            name="username"
            required
          />
        </div>
        <div>
          <label for="register-password" class="block">Password</label>
          <input
            v-model="registerPassword"
            id="login-password"
            type="password"
            name="password"
            required
          />
        </div>
        <button type="submit">Register</button>
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
    <div>
      <span class="pr-4">markup:</span>
      <select
        v-model="markup"
        class="text-textColor bg-document border-bcol border-2 rounded"
      >
        <option v-for="(t, index) in MARKUPS" :value="t" :key="index">
          {{ t }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
h3 {
  margin-top: 1em;
}
</style>
