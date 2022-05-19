<script setup lang="ts">
import { nextTick, ref, watch } from "@vue/runtime-dom";
import { Scroller } from "./scroller";

const props = defineProps({
  watchValue: Object,
  view: String,
});

let scroller: Scroller | undefined;
let oldView: string | undefined = undefined;

let $outerScroll = ref<null | HTMLDivElement>(null);
let $innerScroll = ref<null | HTMLDivElement>(null);
watch([$outerScroll, $innerScroll], () => {
  if ($outerScroll.value && $innerScroll.value) {
    scroller = new Scroller($outerScroll.value, $innerScroll.value);
  }
});

watch(
  () => props.watchValue,
  () => {
    if (scroller && oldView !== props.view) {
      nextTick(scroller.print(false));
      oldView = props.view;
    } else if (scroller && props.watchValue) {
      nextTick(scroller.print(true));
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="scroller-outer" ref="$outerScroll">
    <div class="scroller-middle">
      <div class="scroller-inner" ref="$innerScroll">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroller-outer {
  flex: 1 1 0;
  overflow-y: scroll;
  display: block;
  height: 100%;
  min-width: 0;
}
.scroller-middle {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 100%;
  justify-content: flex-end;
}
.scroller-inner {
  display: block;
  flex: 0 0 0; /* safari */
}
</style>
