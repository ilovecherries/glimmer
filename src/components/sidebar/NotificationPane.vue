<script setup lang="ts">
import { storeToRefs } from "pinia";
import { watch, ref } from "vue";
import { useSharedStore } from "../../stores/shared";
import { useSettingsStore } from "../../stores/settings";
import { avatarUrl } from "@/lib/qcs/types/User";
import type { Notification } from "../../stores/shared";
import ActivityLogPane from "./ActivityLogPane.vue";
import defaultPageIcon from "@/assets/SB-thread.png";

const shared = useSharedStore();
const settings = useSettingsStore();

const { contents, notifications, userlists, users } = storeToRefs(shared);
const { avatarSize, ignoredUsers } = storeToRefs(settings);

let notificationsView = ref<Array<Notification>>([]);

watch(
  () => notifications.value,
  () => {
    console.log("notifs", notifications.value);
    if (notifications.value) {
      const notifs: Array<Notification> = Object.keys(notifications.value).map(
        (n: string) => notifications.value[parseInt(n)]
      );
      notifs.sort((a, b) => {
        const aDate = new Date(a.lastCommentDate);
        const bDate = new Date(b.lastCommentDate);
        if (a.count && !b.count) return -1;
        else if (!a.count && b.count) return 1;
        else if (aDate > bDate) return -1;
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
    <div class="grow">
      <div class="h-full">
        <div v-if="userlists[0]" class="flex w-full h-6 shrink-0 bg-gray-50">
          <div v-for="u in Object.keys(userlists[0])" :key="u" class="relative">
            <img
              :class="`w-auto h-full peer ${
                ignoredUsers.findIndex((x) => x === parseInt(u)) === -1
                  ? 'sepia-0'
                  : 'sepia'
              }`"
              :src="avatarUrl(users[parseInt(u)].avatar, avatarSize)"
            />
            <div
              class="bg-slate-50 min-w-max peer-hover:block hover:block hidden absolute top-6 left-0 z-50 border border-black p-1"
            >
              <div>{{ users[parseInt(u)].username }}</div>
              <hr />
              <div>Currently Browsing</div>
              <div
                v-for="room in Object.keys(userlists).filter((x) =>
                    x !== '0' &&
                    Object.keys(userlists[x]).findIndex((y) => y === u) !== -1
                )"
                :key="room"
              >
                <router-link :to="`/page/${room}`">
                  {{ contents[room].name }}
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <div
          class="flex px-1 box-border h-10"
          v-for="n in notificationsView"
          :key="n.contentId"
        >
          <router-link
            :to="`/page/${n.contentId}`"
            class="py-1 grow h-full w-full my-1"
          >
            <img
              v-if="contents[n.contentId].data.values?.thumbnail"
              :src="avatarUrl(contents[n.contentId].data.values.thumbnail)"
              alt=""
              class="border rounded border-black w-auto h-4 inline"
            />
            <img v-else :src="defaultPageIcon" class="w-auto h-4 inline" />
            <div class="inline px-1">
              {{ contents[n.contentId].data.name }}
            </div>
          </router-link>
          <div
            class="cursor-pointer bg-red-800 hover:bg-red-600 mx-3 my-2.5 text-white text-xs rounded py-0.5 px-2"
            v-if="n.count"
            @click="shared.notifications[n.contentId].count = 0"
          >
            {{ n.count }}
          </div>
        </div>
      </div>
    </div>
    <div class="h-0.5 bg-slate-800"></div>
    <ActivityLogPane />
  </div>
</template>
