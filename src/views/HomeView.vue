<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { storeToRefs } from "pinia";

const identity = useIdentityStore();

const { id, username, avatarUrl } = storeToRefs(identity);
const { login, logout } = identity;

let formUsername = "",
  formPassword = "";

function signIn(username: string, password: string) {
  login(username, password);
}
</script>

<template>
  <main>
    <div>
      <table>
        <tr>
          <td>ID</td>
          <td>{{ id }}</td>
        </tr>
        <tr>
          <td>Avatar</td>
          <td><img :src="avatarUrl" alt="Avatar" /></td>
        </tr>
        <tr>
          <td>Username</td>
          <td>{{ username }}</td>
        </tr>
      </table>
    </div>
    <div>
      <label for="username">Username:</label>
      <input v-model="formUsername" type="text" name="username" />
      <label for="password">Password:</label>
      <input v-model="formPassword" type="password" name="password" />
      <button @click="signIn(formUsername, formPassword)">Log in</button>
      <button @click="logout()">Log out</button>
    </div>
  </main>
</template>
