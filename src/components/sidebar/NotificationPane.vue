<script setup lang="ts">
import { storeToRefs } from "pinia";
import { watch, ref } from "vue";
import { useSharedStore } from "../../stores/shared";
import type { Notification } from "../../stores/shared";
import ActivityLogPane from "./ActivityLogPane.vue";
import defaultPageIcon from "@/assets/SB-thread.png";
import { api } from "@/lib/qcs";
import UserList from "../UserList.vue";

const shared = useSharedStore();

const { contents, notifications } = storeToRefs(shared);

let notificationsView = ref<Array<Notification>>([]);

watch(
  () => notifications.value,
  () => {
    if (notifications.value) {
      const notifs: Array<Notification> = Object.keys(notifications.value).map(
        (n: string) => notifications.value[parseInt(n)]
      );
      notifs.sort((a, b) => {
        const aDate = new Date(a.lastCommentDate);
        const bDate = new Date(b.lastCommentDate);
        // if (a.count && !b.count) return -1;
        // else if (!a.count && b.count) return 1;
        if (aDate > bDate) return -1;
        else if (bDate > aDate) return 1;
        else return 0;
      });
      notificationsView.value = notifs;
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div class="grow flex flex-col">
    <div class="grow flex flex-col border-b border-bcol">
      <div class="flex w-full h-6 shrink-0 bg-accent">
        <UserList :content-id="0" />
      </div>
      <div class="grow overflow-y-auto w-full">
        <div
          class="flex px-1 w-full border-b border-bcol h-10"
          v-for="n in notificationsView"
          :key="n.contentId"
        >
          <router-link
            :to="`/page/${n.contentId}`"
            class="py-1 grow h-full w-full my-1 truncate"
          >
            <img
              v-if="contents[n.contentId].data.values?.thumbnail"
              :src="
                api.getFileURL(contents[n.contentId].data.values.thumbnail!, 0)
              "
              alt=""
              class="border rounded border-bcol w-auto h-4 inline"
            />
            <img v-else :src="defaultPageIcon" class="w-auto h-4 inline" />
            <div class="inline px-1">
              {{ contents[n.contentId].data.name }}
            </div>
          </router-link>
          <div
            class="cursor-pointer bg-notification hover:bg-notification-hover mx-3 my-2.5 text-white text-xs rounded py-0.5 px-2"
            v-if="n.count"
            @click="shared.notifications[n.contentId].count = 0"
          >
            {{ n.count }}
          </div>
        </div>
      </div>
    </div>
    <ActivityLogPane />
  </div>
</template>
