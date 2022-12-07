<script setup="setup" lang="ts">
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
    <div class="p-2">
      <p>Welcome to Glimmer</p>
    </div>
  </main>
</template>
