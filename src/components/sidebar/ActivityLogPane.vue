<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import { ref, nextTick, onUpdated } from "vue";

const shared = useSharedStore();
const settings = useSettingsStore();

const { contents, activityChunks, users } = storeToRefs(shared);
const { avatarSize, activityDisplayUsername } = storeToRefs(settings);

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

onUpdated(scroll);
</script>

<template>
  <div>
    <div>
      <div v-for="a in activityChunks" :key="a.firstId">
        <div class="text-xl activity-bar">
          <router-link :to="`/page/${a.contentId}`">
            {{ contents[a.contentId].data.name }}
          </router-link>
        </div>
        <div
          v-for="c in a.comments"
          class="flex activity-bar overflow-hidden whitespace-pre text-ellipsis"
          :key="c.id"
        >
          <img
            :src="
              avatarUrl(c.values.a || users[c.createUserId].avatar, avatarSize)
            "
            :alt="`${users[c.createUserId].username}'s avatar`"
            class="w-6 h-6 p-1 inline"
            :title="users[c.createUserId].username"
          />
          <div class="inline" v-if="activityDisplayUsername">
            {{ c.values.n || users[c.createUserId].username }}:
          </div>
          <div class="grow inline">{{ c.text }}</div>
        </div>
      </div>
    </div>
    <div ref="$scrollToBottom"></div>
  </div>
</template>
