<script setup lang="ts">
import { ref, watchEffect } from "vue";

import { Markup } from "markup2/parse";
import "@/lib/qcs/markupRender";
import "markup2/legacy";

const props = defineProps({
  content: String,
  lang: String,
});

let $el = ref<HTMLDivElement | null>(null);

watchEffect(() => {
  if ($el.value !== null) {
    if (props.content) {
      try {
        let el = Markup.convert_lang(props.content, props.lang || "plaintext");
        $el.value?.replaceChildren(el);
      } catch (e) {
        console.error(e);
        if ($el.value) {
          $el.value.textContent = props.content;
        }
      }
    }
  }
});
</script>

<template>
  <span ref="$el" class="markup-root break-words"></span>
</template>

<style>
.markup-root img,
video {
  height: 10vh;
  object-fit: contain;
  transition: height .25s ease;
}

.markup-root img:focus,
video:focus {
  height: 70vh;
}

/* .markup-root:after {
  content: ".";
  visibility: hidden;
} */
</style>
