<script setup lang="ts">
import { useSharedStore } from "@/stores/shared";
import { avatarUrl } from "@/lib/qcs/types/User";
import { storeToRefs } from "pinia";
import { onUpdated, nextTick, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import MarkupRender from "./MarkupRender.vue";

const shared = useSharedStore();
const settings = useSettingsStore();

const { commentChunks } = storeToRefs(shared);
const { avatarSize } = storeToRefs(settings);

const props = defineProps({
  contentId: Number,
});

let $scrollToBottom = ref<HTMLDivElement | null>(null);

onUpdated(() => {
  nextTick(() => {
    if ($scrollToBottom.value) {
      $scrollToBottom.value.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  });
});
</script>

<template>
  <div class="overflow-y-scroll grow h-full">
    <div
      v-for="c in commentChunks[props.contentId!]"
      :key="c.firstId"
      class="flex mx-1 my-2"
    >
      <img :src="avatarUrl(c.avatar, avatarSize)" class="w-12 h-12 mx-1" />
      <div class="grow">
        <div class="flex">
          <div class="grow">{{ c.username }}:</div>
          <div class="text-xs text-gray italic">
            {{ c.date.toLocaleTimeString() }}
          </div>
        </div>
        <div
          v-for="m in c.comments"
          class="chat-content my-0.5 flex grow hover:bg-gray-200"
          :key="m.id"
        >
          <div class="grow">
            <MarkupRender :content="m.text"></MarkupRender>
          </div>
        </div>
      </div>
    </div>
    <div ref="$scrollToBottom"></div>
  </div>
</template>
