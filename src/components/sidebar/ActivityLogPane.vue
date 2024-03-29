<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { api } from "@/lib/qcs";
import ScrollerView from "../ScrollerView.vue";

const shared = useSharedStore();
const settings = useSettingsStore();

const { mostRecentComment, contents, activityChunks, users } =
  storeToRefs(shared);
const { avatarSize, activityDisplayUsername, ignoredUsers } =
  storeToRefs(settings);
</script>

<template>
  <ScrollerView :watch-value="mostRecentComment">
    <div
      v-for="a in activityChunks"
      :key="a.firstId"
      v-show="
        a.comments?.filter(
          (c) => ignoredUsers.findIndex((x) => x === c.createUserId) === -1
        ).length !== 0
      "
    >
      <div class="text-lg activity-bar truncate">
        <router-link :to="`/page/${a.contentId}`">
          {{ contents[a.contentId].data.name }}
        </router-link>
      </div>
      <div
        v-for="c in a.comments"
        class="flex activity-bar gap-1"
        :key="c.id"
        v-show="ignoredUsers.findIndex((x) => x === c.createUserId) == -1"
      >
        <img
          :src="
            api.getFileURL(
              c.values.a || users[c.createUserId]?.avatar,
              avatarSize
            )
          "
          :alt="`${users[c.createUserId]?.username || 'someone'}'s avatar`"
          class="w-6 h-6 p-0.5 inline"
          :title="users[c.createUserId]?.username || 'someone'"
        />
        <span v-if="activityDisplayUsername">
          {{ c.values.n || users[c.createUserId]?.username || "someone" }}:
        </span>
        <span>
          {{ c.text.replace(/(\r\n|\n|\r)/gm, " ↲ ") }}
        </span>
      </div>
    </div>
  </ScrollerView>
</template>
