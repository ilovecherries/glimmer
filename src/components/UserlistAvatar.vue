<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import { useSharedStore } from "@/stores/shared";
import { api } from "@/lib/qcs/qcs";

const settings = useSettingsStore();
const shared = useSharedStore();
const { avatarSize, ignoredUsers } = storeToRefs(settings);
const { users } = storeToRefs(shared);

const props = defineProps({
  uid: Number,
});
</script>

<template>
  <img
    :class="`w-auto h-full peer ${
      ignoredUsers.findIndex((x) => x === props.uid) === -1
        ? 'sepia-0'
        : 'sepia'
    }`"
    :src="api.getFileURL(users[props.uid || 0].avatar, avatarSize)"
  />
  <div
    class="hidden peer-hover:block hover:block absolute b-10 bg-document text-textColor z-10 min-w-max p-2 border border-bcol rounded-b"
  >
    <slot></slot>
  </div>
</template>

<style scoped>
img {
  image-rendering: -webkit-optimize-contrast;
  /* image-rendering: crisp-edges; */
}
</style>
