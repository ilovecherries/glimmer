<script setup lang="ts">
import { ref, watch } from "vue";

import Markup_Parse_12y2 from "markup2/parse";
import Markup_Legacy from "markup2/legacy";
import Markup_Langs from "markup2/langs";
import Markup_Render_Dom from "markup2/render";

const parser = new Markup_Parse_12y2();
const langs = new Markup_Langs([parser, new Markup_Legacy()]);
const render = new Markup_Render_Dom();

const props = defineProps({
  content: String,
  lang: String,
  render: Function,
});

let $el = ref<HTMLDivElement | null>(null);

watch(
  () => [props, $el],
  () => {
    if ($el.value !== null) {
      if (props && props.content !== undefined) {
        try {
          const tree = langs.parse(
            props.content,
            props.lang || "plaintext",
            {}
          );
          if (props.render) props.render(tree, $el.value);
          else render.render(tree, $el.value);
        } catch (e) {
          console.error(e);
          if ($el.value) {
            $el.value.textContent = props.content;
          }
        }
      }
    }
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <span ref="$el" class="Markup"></span>
</template>

<style>
@import "markup2/markup.css";
</style>
