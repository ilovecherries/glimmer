<script setup lang="ts">
import { API_DOMAIN, BasicPageDisplaySearch } from "@/lib/qcs/qcs";
import type { SearchResult } from "@/lib/qcs/types/SearchResult";
import { avatarUrl } from "@/lib/qcs/types/User";
import { useIdentityStore } from "@/stores/identity";
import { useSettingsStore } from "@/stores/settings";
import { useStateStore } from "@/stores/state";
import { useSharedStore } from "@/stores/shared";
import { RoomStatus, useWebsocketStore } from "@/stores/websocket";
import { storeToRefs } from "pinia";
import { nextTick, ref, watch, watchEffect } from "vue";
import MarkupRender from "../components/MarkupRender.vue";
import ChatView from "../components/ChatView.vue";

const identity = useIdentityStore();
const state = useStateStore();
const settings = useSettingsStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();

const { headerText } = storeToRefs(state);

const { avatarSize, titleNotifications } = storeToRefs(settings);
const { commentChunks, contents, users, userlists } = storeToRefs(shared);

const props = defineProps({
  id: String,
});

let oldPage: undefined | number = undefined;
let text = ref("");
let name = ref("");

let textboxContent = "";

async function sendMessage(text: string) {
  let msg = {
    text: text,
    contentId: parseInt(props.id!),
    values: {
      m: "12y",
    },
  };

  await fetch(`https://${API_DOMAIN}/api/Write/message`, {
    method: "POST",
    headers: identity.headers,
    body: JSON.stringify(msg),
  });
}

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
      } else {
        websocket.setStatus(id);
        oldPage = id;
      }
    });
    if (contents.value[id]) {
      const page = contents.value[id];
      headerText.value = page.name;
      name.value = page.name;
      text.value = page.text;
      return;
    }
    try {
      const search = BasicPageDisplaySearch(id);
      const pageReq = await fetch(`https://${API_DOMAIN}/api/Request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(search),
      });
      const pageJson: SearchResult = await pageReq.json();
      const page = pageJson.data.content?.shift();
      if (page) {
        headerText.value = page.name;
        name.value = page.name;
        text.value = page.text;
        contents.value[id] = page;
        const users = pageJson.data.user;
        users?.map((x) => {
          shared.users[x.id] = x;
        });
        const messages = pageJson.data.message;
        if (messages) {
          shared.comments = shared.comments.concat(messages);
          shared.sortComments();
          shared.rebuildCommentChunks(id);
          shared.rebuildActivityChunks();
        }
      } else {
        throw new Error("Page wasn't returned from the API.");
      }
    } catch (err) {
      console.error(err);
    }
  }
});

watch(commentChunks.value, () => {
  const current = commentChunks.value[parseInt(props.id!)];
  if (current) {
    const last = current[current.length - 1];
    if (last) {
      const lastComment = last.comments[last.comments.length - 1];
      if (lastComment) {
        if (titleNotifications.value) {
          document.title = lastComment.text;
          changeFavicon(
            avatarUrl(
              users.value[lastComment.createUserId].avatar,
              avatarSize.value
            )
          );
        }
      }
    }
  }
});
</script>

<template>
  <main>
    <div class="flex flex-col h-full">
      <div class="flex flex-col grow h-full">
        <div class="h-10 w-full bg-slate-200">
          <div v-if="userlists[parseInt(props.id!)]" class="flex w-full">
            <div
              v-for="u in Object.keys(userlists[parseInt(props.id!)])"
              :key="u"
            >
              <img
                class="w-10 h-10"
                :src="avatarUrl(users[parseInt(u)].avatar, avatarSize)"
              />
            </div>
          </div>
        </div>
        <div>
          <MarkupRender :content="text" />
        </div>
        <ChatView :contentId="parseInt(props.id!)" />
      </div>
      <div class="h-12 w-full">
        <input
          @keydown.enter="
            sendMessage(textboxContent);
            textboxContent = '';
          "
          type="text"
          v-model="textboxContent"
          class="h-full w-full p-1 chat-box"
        />
      </div>
    </div>
  </main>
</template>

<style>
.chat-content:after {
  content: ".";
  visibility: hidden;
}

.chat-box {
  box-shadow: inset 0px 0px 0px 1px rgb(0, 20, 80);
}
</style>
