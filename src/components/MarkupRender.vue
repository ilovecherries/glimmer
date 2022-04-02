<script setup lang="ts">
import { ref, watchEffect } from "vue";

import { Markup } from "./markup";

const props = defineProps({
  content: String,
});

let $el = ref<HTMLDivElement | null>(null);

watchEffect(() => {
  if ($el.value !== null) {
    if (props.content) {
      try {
        let el = Markup.convert(props.content);
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
  <span ref="$el"></span>
</template>
