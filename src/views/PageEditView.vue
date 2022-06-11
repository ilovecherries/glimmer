<script setup lang="ts">
import { nextTick, ref, watch } from "@vue/runtime-dom";
import { onBeforeRouteLeave } from "vue-router";
import { render, sendRequest } from "@/lib/helpers";
import MarkupRender from "@/components/MarkupRender.vue";
import { MARKUPS } from "contentapi-ts-bindings/Views/Extras/MarkupLanguage";
import { useStateStore } from "@/stores/state";
import { storeToRefs } from "pinia";
import type { Content } from "contentapi-ts-bindings/Views";
import { getPageRequest } from "contentapi-ts-bindings/Helpers";
import type { GetPageResult } from "contentapi-ts-bindings/Helpers";

const state = useStateStore();
const { headerText } = storeToRefs(state);

const props = defineProps({
  id: String,
});

const id = ref(-1);
const content = ref("");
const title = ref("");
const markup = ref("12y2");
const showPreview = ref(false);

watch(
  () => props.id,
  async () => {
    if (props.id) {
      const pid = parseInt(props.id);
      const search = getPageRequest(pid);
      const pageAction = (data: GetPageResult) => {
        const page = data.content?.shift() as Content;
        console.log(page);
        if (page) {
          headerText.value = `Editing ${page.name} (id: ${page.id})`;
          title.value = page.name;
          content.value = page.text;
          id.value = page.id;
          // contents.value[id] = {
          //   data: page,
          //   state: ContentState.full,
          // };
          // const users = data.user;
          // users?.map(shared.addUser);
          // const messages = data.message;
          // if (messages) {
          //   messages.map(shared.addComment);
          //   shared.sortComments();
          //   shared.rebuildCommentChunks(id);
          //   shared.rebuildActivityChunks();
          // }
          // clearNotif();
          markup.value = page.values?.markupLang || "plaintext";
        } else {
          throw new Error("Page wasn't returned from the API.");
        }
      };
      sendRequest<GetPageResult>(search).then(pageAction);
    }
  },
  { immediate: true }
);

onBeforeRouteLeave(() => {
  const answer = window.confirm(
    "Leaving this page discards all unsaved changes. Proceed?"
  );
  // cancel the navigation and stay on the same page
  if (!answer) return false;
});

const $contentBox = ref();

function resizeContentBox() {
  nextTick(() => {
    if ($contentBox.value) {
      $contentBox.value.style.height = "0";
      $contentBox.value.style.height = `${
        $contentBox.value.scrollHeight + 1
      }px`;
    }
  });
}

watch(showPreview, resizeContentBox);

watch(
  content,
  () => {
    resizeContentBox();
  },
  { immediate: true }
);
</script>

<template>
  <main class="h-full flex flex-col">
    <div class="grow overflow-y-scroll p-2">
      <div class="w-full flex mb-4">
        <input
          v-model="title"
          placeholder="Page Title"
          class="border text-2xl p-2 border-bcol bg-document text-textColor grow"
        />
        <button class="px-3 ml-3 shrink-0">Save</button>
      </div>
      <!-- <div class="border border-bcol my-6 mx-auto w-[75%]" /> -->
      <div class="flex mb-2 gap-2">
        <select v-model="markup" class="shink-0">
          <option v-for="(m, i) in MARKUPS" :key="i" :value="m">
            {{ m }}
          </option>
        </select>
        <div class="bg-accent-2 text-accent-text grow p-2 border border-bcol">
          <div v-if="markup === '12y'" class="flex flex-row gap-6">
            <div>/<span class="italic">italic</span>/</div>
            <div>*<span class="font-bold">bold</span>*</div>
            <div>_<span class="underline">underline</span>_</div>
            <div>~<span class="line-through">strikeout</span>~</div>
            <div><span class="text-md">* h2</span></div>
            <div class="flex">
              <span class="text-sm self-end">** h3</span>
            </div>
            <div class="flex">
              <span class="text-xs self-end">*** h4</span>
            </div>
            <div class="flex grow justify-end">
              <router-link class="block bg-document rounded px-2" to="/page/765">guide</router-link>
            </div>
          </div>
          <div v-else-if="markup === '12y2'">
            /<span class="italic">italic</span>/
            **<span class="font-bold">bold</span>**
          </div>
          <div v-else-if="markup === 'bbcode'">
            [i]<span class="italic">italic</span>[/i]
            [b]<span class="font-bold">bold</span>[/b]
          </div>
          <div v-else>No formatting is applied</div>
        </div>
      </div>
      <div class="flex min-h-20em w-full">
        <div class="grow p-2 border border-bcol min-h-max">
          <textarea
            placeholder="Insert page content here..."
            v-model="content"
            class="border-0 font-mono w-full resize-none overflow-hidden text-sm"
            ref="$contentBox"
          ></textarea>
        </div>
        <div
          class="hover:bg-item-hover border border-bcol shrink-0 hover:cursor-pointer flex px-1"
          @click="showPreview = !showPreview"
        >
          <span class="self-center" v-if="showPreview">&gt;</span>
          <span class="self-center" v-else>&lt;</span>
        </div>
        <div class="grow border p-1 border-bcol" v-show="showPreview">
          <MarkupRender :content="content" :lang="markup" :render="render" />
        </div>
      </div>
    </div>
  </main>
</template>
