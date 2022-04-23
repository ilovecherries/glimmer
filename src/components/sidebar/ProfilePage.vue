<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useSettingsStore } from "@/stores/settings";

const identity = useIdentityStore();
const settings = useSettingsStore();

const { login, logout } = identity;
const { loggedIn, username, avatar } = storeToRefs(identity);
const { avatarSize, nickname } = storeToRefs(settings);

function signIn(username: string, password: string) {
  login(username, password);
}

let formUsername = "",
  formPassword = "";
</script>

<template>
  <div v-if="loggedIn" class="grow">
    <img
      :src="avatarUrl(avatar, avatarSize)"
      class="w-6 h-6"
      :alt="username + '\'s avatar'"
    />
    <span>Logged in as </span><b>{{ username }}</b>
    <button class="block" @click="logout()">Log out</button>
    <span>Nickname: </span><input type="text" v-model="nickname" />
  </div>
  <div v-else class="grow">
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
</template>
