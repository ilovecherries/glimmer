<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import ChatView from "@/components/ChatView.vue";
import { useSharedStore } from "@/stores/shared";
import { loadPage, sendRequest } from "@/lib/helpers";
import { useWebsocketStore } from "@/stores/websocket";
import { Status } from "contentapi-ts-bindings/Helpers";
import { onBeforeRouteLeave } from "vue-router";
import EditorView from "../components/EditorView.vue";
import type { Content } from "contentapi-ts-bindings/Views";
import { RequestType } from "contentapi-ts-bindings/Search/RequestType";
import {
  SearchRequests,
  SearchRequest,
} from "contentapi-ts-bindings/Search/SearchRequests";
import ThreadImage from "@/assets/SB-thread.png";
import { api } from "@/lib/qcs";

const identity = useIdentityStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();

const { loggedIn } = storeToRefs(identity);
let openPallette = ref(true);
let commandInput = ref("");
let paletteInput = ref<HTMLInputElement | null>(null);
let contentsSearch = ref([] as Partial<Content>[]);

enum SplitType {
  Chat,
  Editor,
}

interface Split {
  type: SplitType;
  title: string;
  id?: number;
}

let splits = ref([] as Split[]);

function listenForPalletteOpen(e: KeyboardEvent) {
  if (openPallette.value) {
    if (e.key === "Escape") openPallette.value = false;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    openPallette.value = !openPallette.value;
    nextTick(() => {
      commandInput.value = "";
      paletteInput.value?.focus();
    });
  }
}

document.addEventListener("keydown", listenForPalletteOpen, { passive: true });

onBeforeRouteLeave(() => {
  document.removeEventListener("keydown", listenForPalletteOpen);
});

function addPage(id: number) {
  loadPage(id, () => {
    const shared = useSharedStore();
    splits.value.push({
      id,
      type: SplitType.Chat,
      title: shared.contents[id].data.name,
    });
    // shared.notifications[id].count = 0;
    nextTick(() => {
      websocket.setStatus(id, Status.active);
    });
  }).catch((e) => {
    alert(`there was an error loading the room: ${e}`);
  });
}

function addEditor() {
  splits.value.push({ type: SplitType.Editor, title: "Editor" });
}

function pageSearch(query: string) {
  const search = new SearchRequests(
    {
      text: `%${query}%`,
    },
    [
      new SearchRequest(
        RequestType.content,
        "name,id,values",
        "name LIKE @text",
        "id",
        15
      ),
    ]
  );
  type QueryResult = {
    content: Array<Pick<Content, "name" | "id" | "values">>;
  };
  sendRequest<QueryResult>(search).then((data) => {
    contentsSearch.value = data.content;
    selectIndex.value = contentsSearch.value.length > 0 ? 0 : undefined;
  });
}

let timeoutCancel = ref<number | undefined>(undefined);
let selectIndex = ref<number | undefined>(undefined);

watch(commandInput, (query) => {
  if (query.startsWith(":")) {
    contentsSearch.value = [];
    selectIndex.value = undefined;
    return;
  }
  if (query === "") {
    contentsSearch.value = [];
    selectIndex.value = undefined;
    return;
  }
  if (timeoutCancel !== undefined) clearTimeout(timeoutCancel.value);
  timeoutCancel.value = setTimeout(() => {
    pageSearch(query);
    timeoutCancel.value = undefined;
  }, 250);
});
</script>

<template>
  <main class="h-full flex w-full flex-col relative">
    <div
      :class="`flex open-palette z-10 ${openPallette ? 'block' : 'hidden'}`"
      :show="openPallette"
    >
      <div class="palette bg-document text-2xl z-20 border-bcol border-2">
        <div class="p-4 text-2xl border-2 border-bcol">
          <input
            type="text"
            v-model="commandInput"
            class="w-full border-0 bg-document"
            placeholder="Begin typing commands..."
            ref="paletteInput"
            @keydown.down.exact.prevent="
              () => {
                if (selectIndex !== undefined)
                  selectIndex = Math.min(
                    selectIndex + 1,
                    contentsSearch.length - 1
                  );
              }
            "
            @keydown.up.exact.prevent="
              () => {
                if (selectIndex !== undefined)
                  selectIndex = Math.max(selectIndex - 1, 0);
              }
            "
            @keydown.enter.exact.prevent="() => {
              if (commandInput.startsWith(':editor')) {
                addEditor();
              } else if (selectIndex !== undefined) {
                addPage(contentsSearch[selectIndex].id!);
              }
              commandInput = '';
              openPallette = false;
            }"
          />
        </div>
        <div
          class="p-1 border-2 border-bcol text-base"
          v-show="timeoutCancel !== undefined"
        >
          ...
        </div>
        <div
          :class="`p-1 border-2 border-bcol text-base hover:bg-item-hover hover:cursor-pointer ${
            selectIndex === index ? 'bg-item-hover' : ''
          }`"
          v-for="(i, index) in contentsSearch"
          :key="index"
          @click="() => { addPage(i.id!); openPallette = false; }"
        >
          <img
            v-if="i.values?.thumbnail"
            :src="api.getFileURL(i.values.thumbnail, 32)"
            class="h-6 w-6 border border-bcol inline"
          />
          <img
            v-else
            :src="ThreadImage"
            class="h-6 w-6 border border-bcol inline"
          />
          {{ i.name }}
        </div>
      </div>
    </div>
    <div class="grow">
      <div v-if="splits.length === 0">
        <p>Use the command pallette to start creating frames.</p>
        <p>This is NOT recommended for mobile use.</p>
        <p>inspired by fluttershy</p>
      </div>
      <div v-else class="flex h-full gap-1 bg-accent-2">
        <div
          class="grow h-full flex flex-col bg-document"
          v-for="(s, i) in splits"
          :key="i"
        >
          <div class="min-h-min flex bg-accent-2 text-accent-text">
            <div class="grow px-2">
              {{ s.title }}
            </div>
            <div
              class="shrink px-2 cursor-pointer"
              @click="
                () => {
                  splits = [...splits.slice(0, i), ...splits.slice(i + 1)];
                }
              "
            >
              X
            </div>
          </div>
          <template v-if="s.type === SplitType.Chat">
            <ChatView
              :contentId="s.id"
              :showChatBox="loggedIn"
              :showUserlist="loggedIn"
            />
          </template>
          <template v-elif="s.type === SplitType.Editor">
            <EditorView />
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.palette {
  margin: auto;
  width: 30em;
}

.open-palette {
  position: absolute;
  top: 0%;
  left: 0%;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
}
</style>
