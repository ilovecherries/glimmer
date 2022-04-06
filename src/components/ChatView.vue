<script setup lang="ts">
import { useSharedStore } from "@/stores/shared";
import { avatarUrl } from "@/lib/qcs/types/User";
import { storeToRefs } from "pinia";
import { onUpdated, nextTick, ref, watch } from "vue";
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
let editing = ref(0);
let editContent = ref("");
let $editBox = ref();
let $chatBox = ref<null | HTMLTextAreaElement>(null);

async function sendMessage() {
  let msg: Partial<Comment> = {
    text: textboxContent.value.trim(),
    contentId: props.contentId!,
    values: {
      m: "12y",
      a: identity.avatar,
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

async function editMessage() {
  if (editContent.value.trim() === "") {
    await deleteMessage(editing.value);
    editing.value = -1;
    return;
  }

  let msg: Partial<Comment> = {
    id: editing.value,
    text: editContent.value.trim(),
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
    editing.value = -1;
  } catch (e) {
    console.error(e);
  }
}

async function deleteMessage(id: number) {
  try {
    const req = await fetch(`https://${API_DOMAIN}/api/Delete/message/${id}`, {
      method: "POST",
      headers: identity.plaintTextHeaders,
    });
  } catch (e) {
    console.error(e);
  }
}

function upArrowEdit() {
  console.log("hello?");
  console.log($editBox.value);
  if (props.contentId && commentChunks.value[props.contentId]) {
    const room = commentChunks.value[props.contentId];
    for (let i = room.length - 1; i > 0; i--) {
      if (room[i].uid === identity.id) {
        const last = room[i].comments.length - 1;
        editContent.value = room[i].comments[last].text;
        editing.value = room[i].comments[last].id;
        return;
      }
    }
  }
}

watch(editing, () => {
  if (editing.value && editing.value !== -1) {
    nextTick(() => {
      if ($editBox.value) {
        $editBox.value.focus();
        $editBox.value.scrollIntoView();
      }
    });
  }
});

watch(
  () => props.contentId,
  () => {
    editing.value = 0;
  }
);

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
            class="group chat-content my-0.5 grow hover:bg-gray-200 relative"
            :key="m.id"
          >
            <div
              v-if="m.createUserId === identity.id && editing !== m.id"
              class="group-hover:flex hidden absolute right-2 -top-[1em]"
            >
              <button
                class="bg-white border-black mx-1"
                @click="
                  editing = m.id;
                  editContent = m.text;
                "
              >
                EDIT
              </button>
              <button
                class="bg-white border-black mx-1"
                @click="deleteMessage(m.id)"
              >
                DELETE
              </button>
            </div>
            <div v-if="editing === m.id" class="w-full">
              <textarea
                v-model="editContent"
                @keydown.enter.exact.prevent="editMessage"
                @keydown.escape.exact.prevent="editing = -1"
                :ref="
                  (el) => {
                    if (editing === m.id) {
                      $editBox = el;
                    }
                  }
                "
                class="w-full chat-box resize-none p-1"
              ></textarea>
            </div>
            <MarkupRender v-else :content="m.text" />
          </div>
        </div>
      </div>
      <div ref="$scrollToBottom"></div>
    </div>
    <div class="h-12 w-full" v-if="showChatBox">
      <textarea
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.up.exact.prevent="upArrowEdit"
        v-model="textboxContent"
        ref="$chatBox"
        class="block h-full w-full p-1 chat-box resize-none"
      />
    </div>
  </div>
</template>
