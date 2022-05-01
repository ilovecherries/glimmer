<script setup lang="ts">
import { storeToRefs } from "pinia";
import { watch, ref } from "vue";
import { useSharedStore } from "../../stores/shared";
import { avatarUrl } from "@/lib/qcs/types/User";
import type { Notification } from "../../stores/shared";
import ActivityLogPane from "./ActivityLogPane.vue";
import defaultPageIcon from "@/assets/SB-thread.png";
import UserlistAvatar from "../UserlistAvatar.vue";

const shared = useSharedStore();

const { contents, notifications, userlists, users } = storeToRefs(shared);

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
      <div
        v-if="userlists[0]"
        class="flex w-full h-6 shrink-0 bg-accent border-b border-bcol"
      >
        <div
          v-for="(u, index) in Object.keys(userlists[0]).map((x) =>
            parseInt(x)
          )"
          :key="index"
          class="relative"
        >
          <UserlistAvatar :uid="u">
            <div>{{ users[u].username }}</div>
            <hr />
            <div>Currently Browsing</div>
            <div
              v-for="room in Object.keys(userlists).filter(
                (x) =>
                  x !== '0' &&
                  Object.keys(userlists[x]).findIndex(
                    (y) => parseInt(y) === u
                  ) !== -1
              )"
              :key="room"
            >
              <router-link :to="`/page/${room}`">
                {{ contents[parseInt(room)]?.data.name || "Unknown" }}
              </router-link>
            </div>
          </UserlistAvatar>
        </div>
      </div>
      <div class="grow overflow-y w-full">
        <div
          class="flex px-1 w-full border-b border-bcol h-10"
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
