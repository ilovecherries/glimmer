<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { avatarUrl } from "@/lib/qcs/types/User";
import Scroller from "../Scroller.vue";

const shared = useSharedStore();
const settings = useSettingsStore();

const { contents, activityChunks, users } = storeToRefs(shared);
const { avatarSize, activityDisplayUsername, ignoredUsers } = storeToRefs(settings);
</script>

<template>
  <Scroller
    :watch-value="activityChunks?.at(-1)?.comments?.at(-1) || undefined"
  >
    <div
      v-for="a in activityChunks"
      :key="a.firstId"
      v-show="
        a.comments?.filter(
          (c) => ignoredUsers.findIndex((x) => x === c.createUserId) === -1
        ).length !== 0
      "
    >
      <div class="text-xl activity-bar">
        <router-link :to="`/page/${a.contentId}`">
          {{ contents[a.contentId].data.name }}
        </router-link>
      </div>
      <div
        v-for="c in a.comments"
        class="flex activity-bar overflow-hidden whitespace-pre text-ellipsis"
        :key="c.id"
        v-show="ignoredUsers.findIndex((x) => x === c.createUserId) == -1"
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
  </Scroller>
</template>
