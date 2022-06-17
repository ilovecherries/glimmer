<script setup="setup" lang="ts">
import { generateChatChunks, type MessageWithUser } from "@/lib/chunks";
import { useSharedStore } from "@/stores/shared";
import { watch, ref } from "vue";
import { useRoute } from "vue-router";
import CommentChunk from "@/components/CommentChunk.vue";

const shared = useSharedStore();
const route = useRoute();
const comments = ref([] as MessageWithUser[][]);

watch(
  () => route.params.id,
  (pageId) => {
    const id = parseInt(pageId as string) || 0;
    const c = shared.comments.filter((x) => x.contentId === id);
    console.log("CHAT COMMENTS", c)
    comments.value = generateChatChunks(c, Object.values(shared.users));
    console.log("CHAT CHUNKS", comments.value)
  },
  { immediate: true }
);
</script>

<template>
  <main class="h-full flex flex-col w-full">
    <div class="shrink-0">
      THIS IS A TEST VIEW FOR COMMENT CHUNKS ATM, THIS WILL BECOME A SEARCH
    </div>
    <div class="grow overflow-y-scroll">
      <CommentChunk
        v-for="(chunk, index) in comments"
        :key="index"
        :chunk="chunk"
      />
    </div>
  </main>
</template>
