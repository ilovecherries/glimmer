<script setup="setup" lang="ts">
import type { MessageWithUser } from "@/lib/chunks";
import { api } from "@/lib/qcs";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import { render } from "@/lib/helpers";
import MarkupRender from "./MarkupRender.vue";

const settings = useSettingsStore();
const { avatarSize } = storeToRefs(settings);

const props = defineProps({
  chunk: Object,
});
</script>

<template>
  <div class="flex mx-1 my-2">
    <img
      v-if="props.chunk?.[0]?.user?.avatar"
      :src="api.getFileURL(props.chunk?.[0].user.avatar, avatarSize)"
      class="w-auto h-6 md:h-12 mx-1 md:mr-2 md:rounded border border-bcol"
    />
    <div class="grow flex flex-col">
      <div>{{ props.chunk?.[0]?.user?.username }}</div>
      <div class="grow flex flex-col">
        <div
          v-for="(m, index) in (props.chunk as MessageWithUser[])"
          :key="index"
          class="hover:bg-item-hover relative mb-1"
        >
          <MarkupRender
            :render="render"
            :content="m.text"
            :lang="m.values.m || 'plaintext'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
