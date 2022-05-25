<script setup lang="ts">
import { useIdentityStore } from '@/stores/identity';
import { storeToRefs } from 'pinia';
import { nextTick, ref } from 'vue';
import ChatView from '@/components/ChatView.vue';
import { useSharedStore } from '@/stores/shared';
import { loadPage } from '@/lib/helpers';
import { useWebsocketStore } from '@/stores/websocket';
import { Status } from 'contentapi-ts-bindings/Helpers';
import { onBeforeRouteLeave } from 'vue-router';
import EditorView from '../components/EditorView.vue';

const identity = useIdentityStore();
const shared = useSharedStore();
const websocket = useWebsocketStore();
const { contents } = storeToRefs(shared);

const { loggedIn } = storeToRefs(identity);
let openPallette = ref(true);
let commandInput = ref("");
let paletteInput = ref<HTMLInputElement | null>(null);

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
    if (e.key === 'Escape') openPallette.value = false;
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    openPallette.value = !openPallette.value;
    nextTick(() => {
      commandInput.value = "";
      paletteInput.value?.focus();
    });
  }
}

document.addEventListener('keydown', listenForPalletteOpen, { passive: true });

onBeforeRouteLeave(() => {
  document.removeEventListener('keydown', listenForPalletteOpen);
});

function addPage(id: number) {
  loadPage(id)
    .then(() => {
      splits.value.push({
        id,
        type: SplitType.Chat,
        title: contents.value[id].data.name
      });
      // shared.notifications[id].count = 0;
      nextTick(() => {
        websocket.setStatus(id, Status.active);
      });
    })
    .catch(() => {
      alert("there was an error loading the room");
    })
}

function addEditor() {
  splits.value.push({ type: SplitType.Editor, title: "Editor" });
}
</script>

<template>
  <main class="h-full flex w-full flex-col relative">
    <div :class="`open-palette z-10 ${openPallette ? 'block': 'hidden'}`" :show="openPallette">
      <div class="palette bg-document text-2xl z-20 border-bcol border-2">
        <div class="p-4 text-2xl border-2 border-bcol">
          <input type="text"
            v-model="commandInput"
            class="w-full border-0 bg-document"
            placeholder="Begin typing commands..."
            ref="paletteInput"
            @keydown.enter.exact.prevent="() => {
              if (commandInput.startsWith('editor')) {
                addEditor();
              } else {
                addPage(parseInt(commandInput));
              }
              commandInput = '';
              openPallette = false;
            }">
        </div>
        <div class="p-1 border-2 border-bcol text-base">
        </div>
      </div>

    </div>
    <div class="grow">
      <div v-if="splits.length === 0">
        <p>Use the command pallette to start creating frames.</p>
        <p>This is NOT recommended for mobile use.</p>
      </div>
      <div v-else class="flex h-full gap-1 bg-accent-2">
        <div class="grow h-full flex flex-col bg-document" v-for="(s, i) in splits" :key="i">
          <div class="min-h-min flex bg-accent-2 text-accent-text">
            <div class="grow px-2">
              {{ s.title }}
            </div>
            <div class="shrink px-2 cursor-pointer" @click="() => {
                splits = [...splits.slice(0, i), ...splits.slice(i+1)];
              }">
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
          <template v-else="s.type === SplitType.Editor">
            <EditorView />
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.palette {
    position: absolute;
    left: 50%;
    top: 10%;
    width: 30em;

    -webkit-transform: translate3d(-50%, -50%, 0); 
    -moz-transform: translate3d(-50%, -50%, 0);  
    transform: translate3d(-50%, -50%, 0);  
}

.open-palette {
    position: absolute;
    top: 0%; left: 0%;
    width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
}
</style>