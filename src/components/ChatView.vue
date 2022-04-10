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
import { RequestParameter } from "@/lib/qcs/types/RequestParameter";
import { RequestSearchParameter } from "@/lib/qcs/types/RequestSearchParameter";
import { useWebsocketStore } from "@/stores/websocket";
import type { RequestData } from "@/lib/qcs/types/RequestData";

const shared = useSharedStore();
const settings = useSettingsStore();
const identity = useIdentityStore();
const websocket = useWebsocketStore();

const { commentChunks } = storeToRefs(shared);
const { avatarSize, nickname, ignoredUsers, commentPagination, markup } =
  storeToRefs(settings);

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

let textboxContent = ref("");
let editing = ref(0);
let editContent = ref("");
let $editBox = ref();
let $chatBox = ref<null | HTMLTextAreaElement>(null);
let $messages = ref<null | Array<HTMLDivElement>>(null);

let imageData = ref<null | File>(null);
let imageSrc = ref<null | string>(null);
let imageFileUrl = ref<null | string>(null);
let imageFileUrlEl = ref<null | HTMLInputElement>(null);

let shouldScroll = false;
let scrollOnVisibility = false;
const SCROLL_RANGE = 50;

document.addEventListener("visibilitychange", () => {
  if (document.hidden && shouldScroll) {
    scrollOnVisibility = true;
  } else if (!document.hidden && scrollOnVisibility) {
    scroll();
    scrollOnVisibility = false;
  }
});

async function sendMessage() {
  let msg: Partial<Comment> = {
    text: textboxContent.value.trim(),
    contentId: props.contentId!,
    values: {
      m: markup.value,
      a: identity.avatar,
    },
  };

  if (nickname.value) {
    msg.values!.n = nickname.value;
  }

  try {
    shouldScroll = true;
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

function stopEdit() {
  editing.value = -1;
  editContent.value = "";
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
      m: markup.value,
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
    stopEdit();
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
  if (textboxContent.value !== "") return;
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

async function uploadImage() {
  try {
    const formData = new FormData();
    for (let value of formData.values()) {
      console.log(value);
    }
    console.log(imageData.value);
    formData.append("file", imageData.value as Blob);
    console.log(formData);
    const res = await fetch(`https://${API_DOMAIN}/api/File`, {
      method: "post",
      headers: identity.emptyHeaders,
      body: formData,
    });
    const data: any = await res.json();
    const hash = data.hash as string;
    const url = `!https://${API_DOMAIN}/api/File/raw/${hash}`;
    imageFileUrl.value = url;
    nextTick(() => {
      imageFileUrlEl.value?.focus();
      imageFileUrlEl.value?.select();
    });
  } catch (e) {
    console.error(e);
  }
}

function loadOlderMessages() {
  if (props.contentId) {
    const minId = commentChunks.value[props.contentId][0].comments[0].id;
    const search = new RequestParameter(
      { pid: props.contentId, maxId: minId },
      [
        new RequestSearchParameter(
          "message",
          "*",
          "contentId = @pid and id < @maxId and !notdeleted()",
          "id_desc",
          commentPagination.value
        ),
        new RequestSearchParameter("user", "*", "id in @message.createUserId"),
      ]
    );
    websocket.sendRequest(search, (res) => {
      const data = res.data.data as RequestData;
      data.user?.map((x) => shared.addUser(x));
      data.message?.map((x) => shared.addComment(x));
      shared.sortComments();
      shared.rebuildCommentChunks(props.contentId!);
      shared.rebuildActivityChunks();
    });
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
    if (props.contentId && shared.notifications[props.contentId]) {
      shared.notifications[props.contentId].count = 0;
    }
    shouldScroll = true;
  }
);

function detectImagePaste(event: ClipboardEvent) {
  if (event.clipboardData) {
    const item = event.clipboardData.files[0];
    imageData.value = item;
  }
}

function detectImageDrop(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    const item = event.dataTransfer.files[0];
    imageData.value = item;
  }
}

watch(imageData, () => {
  if (imageData.value) {
    var reader = new FileReader();
    reader.onload = function (event) {
      imageFileUrl.value = null;
      imageSrc.value = event.target!.result as string;
    };
    reader.readAsDataURL(imageData.value);
  }
});

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      if (shouldScroll) {
        nextTick(() => {
          if ($scrollToBottom.value) {
            $scrollToBottom.value.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
          }
        });
        if (props.contentId && shared.notifications[props.contentId]) {
          shared.notifications[props.contentId].count = 0;
        }
      }
    }
  }
});

let $chatContainer = ref<HTMLDivElement | null>(null);
watch($chatContainer, () => {
  if ($chatContainer.value) {
    resizeObserver.observe($chatContainer.value);
  }
});

function updateScroll() {
  if ($chatContainer.value) {
    const scrolled =
      $chatContainer.value.scrollHeight - $chatContainer.value.scrollTop;
    const height = $chatContainer.value.clientHeight;
    shouldScroll = scrolled <= height + SCROLL_RANGE;
  }
}
</script>

<template>
  <div class="flex flex-col grow h-full">
    <div
      class="overflow-y-scroll grow h-full"
      ref="$chatContainer"
      @scroll="updateScroll"
    >
      <button @click="loadOlderMessages">LOAD OLDER MESSAGES</button>
      <div
        v-for="c in commentChunks[props.contentId!]"
        :key="c.firstId"
        v-show="ignoredUsers.findIndex((x) => x === c.uid) == -1"
        class="flex mx-1 my-2"
        :ref="
          (el) => {
            if (el) resizeObserver.observe(el as Element);
          }
        "
      >
        <img
          :src="avatarUrl(c.avatar, avatarSize)"
          class="w-12 h-12 mx-1 mr-2 rounded border border-black"
        />
        <div class="grow">
          <div class="flex mb-1">
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
            class="group chat-content my-0.5 grow hover:bg-gray-200 relative mb-1"
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
                @keydown.escape.exact.prevent="stopEdit"
                :ref="
                  (el) => {
                    if (editing === m.id) {
                      $editBox = el;
                    }
                  }
                "
                class="w-full chat-box resize-none p-1"
              ></textarea>
              <button class="mx-1" @click="stopEdit">CANCEL</button>
            </div>
            <MarkupRender
              v-else
              :content="m.text"
              :lang="m.values.m || 'plaintext'"
            />
          </div>
        </div>
      </div>
      <div ref="$scrollToBottom"></div>
    </div>
    <div class="h-12 w-full relative">
      <div
        v-if="imageSrc"
        class="absolute top-0 right-4 w-60 bg-white m-1 -translate-y-full box-border"
      >
        <img :src="imageSrc" alt="" class="img-upload-view w-full h-auto p-1" />
        <div v-show="imageFileUrl">
          <input
            type="text"
            class="w-full"
            ref="imageFileUrlEl"
            :value="imageFileUrl"
            @blur="
              imageSrc = null;
              imageData = null;
            "
            readonly
          />
        </div>
        <div v-if="!imageFileUrl">
          <button class="mx-1" @click="uploadImage">Upload</button>
          <button
            class="mx-1"
            @click="
              imageSrc = null;
              imageData = null;
            "
          >
            Cancel
          </button>
        </div>
      </div>
      <div class="h-12 w-full" v-if="showChatBox">
        <textarea
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.up.exact.prevent="upArrowEdit"
          @paste="detectImagePaste"
          @drop="detectImageDrop"
          v-model="textboxContent"
          ref="$chatBox"
          class="block h-full w-full p-1 chat-box resize-none"
        />
      </div>
    </div>
  </div>
</template>

<style>
.img-upload-view {
  image-rendering: pixelated;
}

</style>
