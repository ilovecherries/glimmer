<script setup lang="ts">
import { ref, watch } from "vue";

const Markup_Parse_12y2 = require("../../markup2/parse");
const Markup_Legacy = require("../../markup2/legacy");
const Markup_Langs = require("../../markup2/langs");
const Markup_Render_Dom = require("../../markup2/render");

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
@import "../../markup2/markup.css";
.Markup img {
  height: var(--T-embed-height);
}
</style>
