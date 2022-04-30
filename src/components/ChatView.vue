<script setup lang="ts">
import { useSharedStore } from "@/stores/shared";
import { avatarUrl } from "@/lib/qcs/types/User";
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import { useSettingsStore } from "@/stores/settings";
import MarkupRender from "markup2/MarkupRender.vue";
import { API_DOMAIN } from "@/lib/qcs/qcs";
import { useIdentityStore } from "@/stores/identity";
import type { Comment } from "@/lib/qcs/types/Comment";
import { RequestParameter } from "@/lib/qcs/types/RequestParameter";
import { RequestSearchParameter } from "@/lib/qcs/types/RequestSearchParameter";
import Scroller from "./Scroller.vue";
import { rethreadMessages, sendRequest } from "../lib/helpers";
import { render, last } from "../lib/helpers";

const shared = useSharedStore();
const settings = useSettingsStore();
const identity = useIdentityStore();

const { commentChunks, userlists, users, contents } = storeToRefs(shared);
const { avatarSize, nickname, ignoredUsers, commentPagination, markup } =
  storeToRefs(settings);

const props = defineProps({
  contentId: Number,
  showChatBox: Boolean,
  showUserlist: Boolean,
  showContentName: Boolean,
});

let textboxContent = ref("");
let editing = ref(0);
let editContent = ref("");
let $editBox = ref();
let $chatBox = ref<null | HTMLDivElement>(null);

let imageData = ref<null | File>(null);
let imageSrc = ref<null | string>(null);
let imageFileUrl = ref<null | string>(null);
let imageFileUrlEl = ref<null | HTMLInputElement>(null);

let rethreading = ref(false);
type RethreadMessage = {
  [key: number]: boolean;
};
let rethreadingMessages = ref<RethreadMessage>({});
let rethreadStart = ref(-1);
let rethreadEnd = ref(-1);
let rethreadingContentId = 0;

let sendingMessage = false;

async function sendMessage() {
  if (!props.contentId || textboxContent.value.trim() === "" || sendingMessage)
    return;
  sendingMessage = true;

  let msg: Partial<Comment> = {
    text: textboxContent.value.trim(),
    contentId: props.contentId,
    values: {
      m: markup.value,
      a: identity.avatar,
    },
  };

  if (msg.values && nickname.value) {
    msg.values.n = nickname.value;
  }

  try {
    await fetch(`https://${API_DOMAIN}/api/Write/message`, {
      method: "POST",
      headers: identity.headers,
      body: JSON.stringify(msg),
    });
    textboxContent.value = "";
  } catch (e) {
    console.error(e);
  }

  sendingMessage = false;
}

function stopEdit() {
  editing.value = -1;
  editContent.value = "";
}

async function editMessage() {
  if (!props.contentId) return;

  if (editContent.value.trim() === "") {
    await deleteMessage(editing.value);
    editing.value = -1;
    return;
  }

  let msg: Partial<Comment> = {
    id: editing.value,
    text: editContent.value.trim(),
    contentId: props.contentId,
    values: {
      m: markup.value,
      a: identity.avatar,
    },
  };

  if (nickname.value && msg.values) {
    msg.values.n = nickname.value;
  }

  try {
    await fetch(`https://${API_DOMAIN}/api/Write/message`, {
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
    await fetch(`https://${API_DOMAIN}/api/Delete/message/${id}`, {
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

let loadingOlderMessages = ref(false);
function loadOlderMessages() {
  if (props.contentId) {
    const contentId = props.contentId;
    loadingOlderMessages.value = true;
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
    sendRequest(search, (data) => {
      data.user?.map((x) => shared.addUser(x));
      data.message?.map((x) => shared.addComment(x));
      shared.sortComments();
      shared.rebuildCommentChunks(contentId);
      shared.rebuildActivityChunks();
      loadingOlderMessages.value = false;
    });
  }
}

watch(editing, () => {
  if (editing.value && editing.value !== -1) {
    nextTick(() => {
      if ($editBox.value) {
        $editBox.value.focus();
      }
    });
  }
});

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
      if (event.target) {
        imageFileUrl.value = null;
        imageSrc.value = event.target.result as string;
      }
    };
    reader.readAsDataURL(imageData.value);
  }
});

watch(editContent, () => {
  if ($editBox.value) {
    // $editBox.value.style.height = $editBox.value.scrollHeight - 4 + "px";
    let area = $editBox.value;
    area.style.overflow = "hidden";
    area.style.height = area.scrollHeight + "px";
  }
});

watch(
  rethreadingMessages,
  () => {
    console.log(rethreadingMessages.value);
  },
  { deep: true }
);

function toggleIgnoreUser(uid: number) {
  if (ignoredUsers.value.findIndex((x) => x === uid) === -1) {
    ignoredUsers.value.push(uid);
  } else {
    ignoredUsers.value = ignoredUsers.value.filter((x) => x !== uid);
  }
}

function canRethread(comment: Comment): boolean {
  return (
    comment.createUserId === identity.id &&
    rethreadStart.value <= comment.id &&
    rethreadEnd.value >= comment.id
  );
}

async function rethread(contentId: number) {
  const ids = shared.comments
    .filter((x) => x.contentId === props.contentId && canRethread(x))
    .map((x) => x.id);
  await rethreadMessages(ids, contentId);
  rethreading.value = false;
  rethreadStart.value = -1;
  rethreadEnd.value = -1;
}

function resizeEditBox() {
  nextTick(() => {
    $editBox.value.style.height = "0";
    const parent: HTMLDivElement | null = $editBox.value.parentNode;
    if (parent) {
      parent.style.height = $editBox.value.style.height = `${
        $editBox.value.scrollHeight + 1
      }px`;
    }
  });
}
</script>

<template>
  <div class="flex flex-col grow">
    <div
      class="w-full h-6 text-sm bg-slate-800 text-textColor"
      v-if="showContentName"
    >
      {{ contents[props.contentId]?.name }}
    </div>
    <div class="h-8 md:h-10 w-full bg-accent flex" v-if="showUserlist">
      <div class="grow">
        <div
          v-if="props.contentId && userlists[props.contentId]"
          class="flex w-full h-full"
        >
          <div
            v-for="u in Object.keys(userlists[props.contentId])"
            :key="u"
            class="relative h-full"
          >
            <img
              :class="`w-auto h-full peer ${
                ignoredUsers.findIndex((x) => x === parseInt(u)) === -1
                  ? 'sepia-0'
                  : 'sepia'
              }`"
              :src="avatarUrl(users[parseInt(u)].avatar, avatarSize)"
            />
            <div
              class="hidden peer-hover:block hover:block absolute b-10 bg-slate-100 z-10 min-w-max"
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
      <div class="shrink-0 w-8 h-full">
        <button
          class="h-full w-full bg-accent-2"
          @click="rethreading = !rethreading"
        >
          ...
        </button>
      </div>
    </div>
    <div class="flex flex-col grow h-full">
      <Scroller
        v-if="props.contentId"
        :watch-value="
          (props.contentId &&
            last(last(commentChunks[props.contentId])?.comments)) ||
          undefined
        "
      >
        <div class="w-full">
          <div
            v-if="loadingOlderMessages"
            class="w-full flex justify-items-center items-center"
          >
            <div class="grow"></div>
            <div class="shrink-0">...</div>
            <div class="grow"></div>
          </div>
          <button
            v-else
            @click="loadOlderMessages"
            class="text-link hover:text-link-hover"
          >
            LOAD OLDER MESSAGES
          </button>
        </div>
        <div
          v-for="c in commentChunks[props.contentId]"
          :key="c.firstId"
          v-show="ignoredUsers.findIndex((x) => x === c.uid) == -1"
          class="flex mx-1 my-2"
        >
          <img
            :src="avatarUrl(c.avatar, avatarSize)"
            class="w-auto h-6 md:h-12 mx-1 md:mr-2 md:rounded border border-bcol"
          />
          <div class="grow">
            <div class="flex mb-1">
              <div class="grow">
                <span v-if="c.nickname">
                  {{ c.nickname }} (<router-link :to="`/user/${c.uid}`">{{
                    c.username
                  }}</router-link
                  >):
                </span>
                <router-link :to="`/user/${c.uid}`" v-else>
                  {{ c.username }}:</router-link
                >
              </div>
              <div class="text-xs text-gray italic">
                {{ new Date(c.date).toLocaleTimeString() }}
              </div>
            </div>
            <div
              v-for="m in c.comments"
              :class="`group chat-content my-0.5 grow hover:bg-item-hover relative mb-1 ${
                rethreading &&
                m.createUserId === identity.id &&
                rethreadStart <= m.id &&
                rethreadEnd >= m.id
                  ? 'bg-green-200'
                  : ''
              }`"
              :key="m.id"
            >
              <div
                v-if="m.createUserId === identity.id && rethreading"
                class="absolute block -left-[3.5em] top-0"
              >
                <input
                  type="checkbox"
                  class="mx-2"
                  :checked="rethreadStart === m.id"
                  @click="rethreadStart = m.id"
                />
                <input
                  type="checkbox"
                  :checked="rethreadEnd === m.id"
                  @click="rethreadEnd = m.id"
                />
              </div>
              <div
                v-if="m.createUserId === identity.id && editing !== m.id"
                class="msg-icon-container"
              >
                <button
                  @click="
                    editing = m.id;
                    editContent = m.text;
                    resizeEditBox();
                  "
                >
                  📝
                </button>
                <button @click="deleteMessage(m.id)">🗑</button>
              </div>
              <div v-if="editing === m.id" class="w-full">
                <div class="w-full">
                  <textarea
                    v-model="editContent"
                    @keydown.enter.exact.prevent="editMessage"
                    @keydown.escape.exact.prevent="stopEdit"
                    @input="resizeEditBox"
                    :ref="
                      (el) => {
                        if (editing === m.id) {
                          $editBox = el;
                        }
                      }
                    "
                    class="text-textColor bg-document w-full chat-box resize-none p-1 border-bcol"
                  ></textarea>
                </div>
                <div class="w-full flex bg-document">
                  <div class="grow">
                    <button
                      class="border-bcol py-1 px-3 hover:bg-item-hover border-l border-r border-b"
                      @click="stopEdit"
                    >
                      ❌
                    </button>
                  </div>
                  <button
                    class="shrink-0 py-1 px-3 border-bcol hover:bg-item-hover border-l border-r border-b"
                    @click="editMessage"
                  >
                    ✉️
                  </button>
                </div>
              </div>
              <MarkupRender
                v-else
                :render="render"
                :content="m.text"
                :lang="m.values.m || 'plaintext'"
              />
            </div>
          </div>
        </div>
      </Scroller>
      <div class="grow h-full" v-else>No content id?</div>
      <div
        class="h-6 w-full shrink-0 bg-slate-800 text-white flex"
        v-if="rethreading"
      >
        <div class="grow">RETHREADING</div>
        <input
          type="number"
          class="text-textColor"
          v-model="rethreadingContentId"
        />
        <button @click="rethread(rethreadingContentId)">commit</button>
      </div>
      <div class="shrink-0 h-12 w-full relative" v-if="showChatBox">
        <div
          v-if="imageSrc"
          class="absolute top-0 right-4 w-60 bg-white m-1 -translate-y-full box-border"
        >
          <img
            :src="imageSrc"
            alt=""
            class="img-upload-view w-full h-auto p-1"
          />
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
        <div ref="$chatBox" class="h-12 w-full absolute" v-if="showChatBox">
          <textarea
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.up.exact="upArrowEdit"
            @paste="detectImagePaste"
            @drop="detectImageDrop"
            v-model="textboxContent"
            class="block h-full w-full p-1 chat-box resize-none bg-document"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.img-upload-view {
  image-rendering: pixelated;
}
</style>
