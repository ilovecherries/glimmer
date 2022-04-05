<script setup lang="ts">
import { useSharedStore } from "@/stores/shared";
import { avatarUrl } from "@/lib/qcs/types/User";
import { storeToRefs } from "pinia";
import { onUpdated, nextTick, ref } from "vue";
import { useSettingsStore } from "@/stores/settings";
import MarkupRender from "./MarkupRender.vue";
import { API_DOMAIN } from "@/lib/qcs/qcs";
import { useIdentityStore } from "@/stores/identity";
import type { Comment } from "@/lib/qcs/types/Comment";

const shared = useSharedStore();
const settings = useSettingsStore();
const identity = useIdentityStore();

const { commentChunks } = storeToRefs(shared);
const { avatarSize, nickname } = storeToRefs(settings);

const props = defineProps({
  contentId: Number,
  showChatBox: Boolean,
});

let $scrollToBottom = ref<HTMLDivElement | null>(null);

function scroll() {
  nextTick(() => {
    if ($scrollToBottom.value) {
      $scrollToBottom.value.scrollIntoView({
        block: "end",
      });
    }
  });
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    scroll();
  }
});

window.addEventListener("resize", () => {
  scroll();
});

let textboxContent = ref("");

async function sendMessage() {
  let msg: Partial<Comment> = {
    text: textboxContent.value.trim(),
    contentId: props.contentId!,
    values: {
      m: "12y",
    },
  };

  if (nickname.value) {
    msg.values!.n = nickname.value;
  }

  try {
    const req = await fetch(`https://${API_DOMAIN}/api/Write/message`, {
      method: "POST",
      headers: identity.headers,
      body: JSON.stringify(msg),
    });
    textboxContent.value = "";
  } catch (e) {
    console.error(e);
  }
}

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
  <div class="flex flex-col grow h-full">
    <div class="overflow-y-scroll grow h-full">
      <div
        v-for="c in commentChunks[props.contentId!]"
        :key="c.firstId"
        class="flex mx-1 my-2"
      >
        <img :src="avatarUrl(c.avatar, avatarSize)" class="w-12 h-12 mx-1" />
        <div class="grow">
          <div class="flex">
            <div class="grow">
              <span v-if="c.nickname">
                {{ c.nickname }} ({{ c.username }}):
              </span>
              <span v-else> {{ c.username }}: </span>
            </div>
            <div class="text-xs text-gray italic">
              {{ new Date(c.date).toLocaleTimeString() }}
            </div>
          </div>
          <div
            v-for="m in c.comments"
            class="chat-content my-0.5 flex grow hover:bg-gray-200"
            :key="m.id"
          >
            <div class="grow break-words">
              <MarkupRender :content="m.text"></MarkupRender>
            </div>
          </div>
        </div>
      </div>
      <div ref="$scrollToBottom"></div>
    </div>
    <div class="h-12 w-full" v-if="showChatBox">
      <textarea
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact.prevent="textboxContent += '\n'"
        v-model="textboxContent"
        class="block h-full w-full p-1 chat-box resize-none"
      />
    </div>
  </div>
</template>
