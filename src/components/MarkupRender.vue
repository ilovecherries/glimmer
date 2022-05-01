<script setup lang="ts">
import { ref, watch } from "vue";

import { Markup_Parse_12y2 } from "markup2/parse";
import { Markup_Langs } from "markup2/langs";
import { Markup_Render_Html } from "markup2/render";

const parse = new Markup_Parse_12y2();
const langs = new Markup_Langs({ "12y2": parse.parse });
const render = new Markup_Render_Html();

const props = defineProps({
  content: String,
  lang: String,
  render: Function,
});

let $el = ref<HTMLDivElement | null>(null);

watch(
  () => props,
  () => {
    if ($el.value !== null) {
      if (props && props.content !== undefined) {
        try {
          const tree = langs.parse(props.content, props.lang || "plaintext");
          let el: DocumentFragment;
          if (props.render) {
            el = props.render(tree);
          } else {
            el = render.render(tree);
          }
          $el.value.replaceChildren(el);
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
  <span ref="$el" class="🍂"></span>
</template>

<style>
@import "markup2/markup.css";
</style>
