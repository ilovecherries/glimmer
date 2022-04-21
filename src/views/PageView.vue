<script setup lang="ts">
import { API_DOMAIN, BasicPageDisplaySearch } from "@/lib/qcs/qcs";
import type { SearchResult } from "@/lib/qcs/types/SearchResult";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useIdentityStore } from "@/stores/identity";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import { ContentState, useSharedStore } from "@/stores/shared";
import { RoomStatus, useWebsocketStore } from "@/stores/websocket";
import { storeToRefs } from "pinia";
import { nextTick, watch, watchEffect } from "vue";
import MarkupRender from "../components/MarkupRender.vue";
import ChatView from "../components/ChatView.vue";
import type { RequestData } from "@/lib/qcs/types/RequestData";

const identity = useIdentityStore();
const state = useStateStore();
const settings = useSettingsStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();

const { headerText } = storeToRefs(state);

const { avatarSize, titleNotifications, ignoredUsers } = storeToRefs(settings);
const { commentChunks, contents, users, userlists } = storeToRefs(shared);
const { loggedIn } = storeToRefs(identity);

const props = defineProps({
  id: String,
});

let oldPage: undefined | number = undefined;

function changeFavicon(link: string) {
  let $favicon: HTMLLinkElement | null =
    document.querySelector('link[rel="icon"]');
  // If a <link rel="icon"> element already exists,
  // change its href to the given link.
  if ($favicon !== null) {
    $favicon.href = link;
    // Otherwise, create a new element and append it to <head>.
  } else {
    $favicon = document.createElement("link");
    $favicon.rel = "icon";
    $favicon.href = link;
    document.head.appendChild($favicon);
  }
}

watchEffect(async () => {
  if (props.id) {
    const id = parseInt(props.id);
    nextTick(() => {
      if (oldPage && oldPage !== id) {
        console.log(`${oldPage} -> ${id}`);
        websocket.setStatus(oldPage, RoomStatus.notPresent);
        websocket.setStatus(id);
        oldPage = id;
      } else if (!oldPage) {
        websocket.setStatus(id);
        oldPage = id;
      }
    });
    if (contents.value[id] && contents.value[id].state === ContentState.full) {
      const page = contents.value[id].data;
      headerText.value = page.name;
      return;
    }
    try {
      const search = BasicPageDisplaySearch(id);
      const pageAction = (data: RequestData) => {
        const page = data.content?.shift();
        if (page) {
          headerText.value = page.name;
          contents.value[id] = {
            data: page,
            state: ContentState.full,
          };
          const users = data.user;
          users?.map((x) => {
            shared.users[x.id] = x;
          });
          const messages = data.message;
          if (messages) {
            shared.comments = shared.comments.concat(messages);
            shared.sortComments();
            shared.rebuildCommentChunks(id);
            shared.rebuildActivityChunks();
          }
          const clearNotif = () => {
            if (shared.messageInitialLoad) {
              if (props.id && shared.notifications[parseInt(props.id)]) {
                shared.notifications[parseInt(props.id)].count = 0;
              }
            } else setTimeout(clearNotif, 20);
          };
          clearNotif();
        } else {
          throw new Error("Page wasn't returned from the API.");
        }
      };
      if (loggedIn.value) {
        websocket.sendRequest(search, (res) => {
          pageAction(res.data.objects);
        });
      } else {
        const pageReq = await fetch(`https://${API_DOMAIN}/api/Request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(search),
        });
        const pageJson: SearchResult = await pageReq.json();
        pageAction(pageJson.data);
      }
    } catch (err) {
      console.error(err);
    }
  }
});

watch(commentChunks.value, () => {
  if (props.id) {
    const current = commentChunks.value[parseInt(props.id)];
    if (current) {
      const last = current[current.length - 1];
      if (last) {
        const lastComment = last.comments[last.comments.length - 1];
        if (lastComment) {
          if (titleNotifications.value) {
            document.title = lastComment.text;
            changeFavicon(
              avatarUrl(
                lastComment.values?.a ||
                  users.value[lastComment.createUserId].avatar,
                avatarSize.value
              )
            );
          }
        }
      }
    }
  }
});

function toggleIgnoreUser(uid: number) {
  if (ignoredUsers.value.findIndex(x => x === uid) === -1) {
    ignoredUsers.value.push(uid);
  } else {
    ignoredUsers.value = ignoredUsers.value.filter(x => x !== uid);
  }
}
</script>

<template>
  <main class="h-full">
    <div class="flex flex-col h-full">
      <div class="flex flex-col grow h-full">
        <div class="h-10 w-full bg-slate-200">
          <div v-if="userlists[parseInt(props.id!)]" class="flex w-full">
            <div
              v-for="u in Object.keys(userlists[parseInt(props.id!)])"
              :key="u"
              class="relative"
            >
              <img
                :class="`w-10 h-10 peer ${
                  ignoredUsers.findIndex((x) => x === parseInt(u)) === -1
                    ? 'sepia-0'
                    : 'sepia'
                }`"
                :src="avatarUrl(users[parseInt(u)].avatar, avatarSize)"
              />
              <div
                class="hidden peer-hover:block hover:block absolute b-10 bg-slate-100 z-50 min-w-max"
              >
                <div>{{ users[parseInt(u)].username }}</div>
                <div>{{ users[parseInt(u)].createDate }}</div>
                <div
                  @click="toggleIgnoreUser(parseInt(u))"
                  class="hover:cursor-pointer"
                >
                  Ignore User
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- <div
          v-if="contents[parseInt(props.id!)] && (contents[parseInt(props.id!)].state === ContentState.full)"
        >
          <MarkupRender :content="contents[parseInt(props.id!)].data.text" />
        </div> -->
        <ChatView :contentId="parseInt(props.id!)" :showChatBox="true" />
      </div>
    </div>
  </main>
</template>

<style>
.chat-box {
  box-shadow: inset 0px 0px 0px 1px rgb(0, 20, 80);
}
</style>
