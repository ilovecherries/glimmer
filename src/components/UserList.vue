<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSharedStore } from "@/stores/shared";
import { useSettingsStore } from "@/stores/settings";
import { api } from "@/lib/qcs";
const shared = useSharedStore();
const settings = useSettingsStore();
const { avatarSize, ignoredUsers } = storeToRefs(settings);
const { users, userlists } = storeToRefs(shared);

const props = defineProps({
  contentId: Number,
});

function toggleIgnoreUser(uid: number) {
  if (ignoredUsers.value.findIndex((x) => x === uid) === -1) {
    ignoredUsers.value.push(uid);
  } else {
    ignoredUsers.value = ignoredUsers.value.filter((x) => x !== uid);
  }
}
</script>

<template>
  <div
    v-if="userlists[props.contentId!]"
    class="flex w-full shrink-0 bg-accent border-b border-bcol h-full"
  >
    <div
      v-for="(u, index) in Object.keys(userlists[props.contentId!]).map((x) => parseInt(x))"
      :key="index"
      class="relative"
    >
      <img
        :class="`w-auto h-full peer ${
          ignoredUsers.findIndex((x) => x === u) === -1 ? 'sepia-0' : 'sepia'
        }`"
        :src="api.getFileURL(users[u].avatar, avatarSize)"
      />
      <div
        class="hidden peer-hover:block hover:block absolute b-10 bg-document text-textColor z-10 min-w-max p-2 border border-bcol rounded-b"
      >
        <router-link :to="`/user/${u}`">
          {{ users[u].username }}
        </router-link>
        <hr />
        <button @click="toggleIgnoreUser(u)">Ignore User</button>
        OwO World!
      </div>
    </div>
  </div>
</template>
