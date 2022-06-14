<script setup="setup" lang="ts">
import { ref, watch } from "vue";
import { api } from "@/lib/qcs";
import { useRouter } from "vue-router";
import type { SearchResult } from "./SearchArea";

const SEARCH_TIMER = 250;

const props = defineProps({
  // (content: string) => SearchResult[]
  search: Function,
});
const router = useRouter();

// ohhhhh realizing this WON'T be compatible a shame but uhhhh maybe the popup
// can?
let searchInput = ref("");
// will make this generic later just want to do contents for now
let searchResults = ref([] as SearchResult[]);
let searchIndex = ref<number | undefined>(undefined);

let timeoutCancel = ref<number | undefined>(undefined);

watch(searchInput, (query) => {
  if (timeoutCancel.value !== undefined) {
    clearTimeout(timeoutCancel.value);
    timeoutCancel.value = undefined;
  }
  if (!query || query.length === 0) {
    searchResults.value = [];
    searchIndex.value = undefined;
    return;
  }
  timeoutCancel.value = setTimeout(async () => {
    searchResults.value = (await props.search?.(query)) || [];
    timeoutCancel.value = undefined;
  }, SEARCH_TIMER);
});

function runResult(result?: SearchResult) {
  if (result?.link) {
    router.push(result.link);
  } else if (result?.callback) {
    result.callback();
  }
  searchInput.value = "";
}
</script>

<template>
  <div class="w-full relative">
    <input
      type="search"
      v-model="searchInput"
      placeholder="Begin typing to see results..."
      class="w-full h-12 text-lg p-2"
      @keydown.down.exact.prevent="
        () => {
          if (searchIndex !== undefined)
            searchIndex = Math.min(searchIndex + 1, searchResults.length - 1);
        }
      "
      @keydown.up.exact.prevent="
        () => {
          if (searchIndex !== undefined)
            searchIndex = Math.max(searchIndex - 1, 0);
        }
      "
      @keydown.enter.exact.prevent="runResult(searchResults[searchIndex || 0])"
    />
    <div
      class="absolute top-12 border border-bcol w-full overflow-y-scroll bg-document min-h-min max-h-[50vh]"
      v-show="timeoutCancel !== undefined || searchResults.length"
    >
      <div
        v-show="timeoutCancel !== undefined"
        class="p-1 border border-bcol text-base"
      >
        ...
      </div>
      <ol>
        <li
          v-for="(i, index) in searchResults"
          :key="index"
          @click="runResult(i)"
          :class="`p-1 border border-bcol text-base hover:bg-item-hover hover:cursor-pointer ${
            searchIndex === index ? 'bg-item-hover' : ''
          }`"
        >
          <img
            v-if="i.thumbnail"
            :src="api.getFileURL(i.thumbnail, 32)"
            class="h-5 w-5 border border-bcol inline"
          />
          {{ i.content }}
        </li>
      </ol>
    </div>
  </div>
</template>
