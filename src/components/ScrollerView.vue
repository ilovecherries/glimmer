<script setup lang="ts">
import { nextTick, ref, watch } from "@vue/runtime-dom";
import { Scroller } from "./scroller";

const props = defineProps({
  watchValue: Object,
  view: Object,
  animate: Boolean,
});

let scroller: Scroller | undefined;
let oldView: object | undefined = undefined;
// interface CachedState {
//   /**
//    * $innerScroll.value.scrollTop
//    */
//   scroll: number;
//   /**
//    * watchValue
//    */
//   watchValue: number;
// }
// let cachedStates: Record<string, CachedState> = {};

let $outerScroll = ref<null | HTMLDivElement>(null);
let $innerScroll = ref<null | HTMLDivElement>(null);
watch([$outerScroll, $innerScroll], () => {
  if ($outerScroll.value && $innerScroll.value) {
    scroller = new Scroller($outerScroll.value, $innerScroll.value);
    nextTick(scroller.scroll_instant());
  }
});
let oldWatchValue: number | undefined;

// const updateState = () => {
//   const view = props.view;
//   const scroll = $innerScroll.value?.scrollTop;
//   const watchValue = props.watchValue;
//   if (view !== undefined && scroll !== undefined && watchValue !== undefined) {
//     cachedStates[view] = {
//       scroll,
//       watchValue,
//     };
//   }
// };

watch(
  () => [props.watchValue, props.view],
  () => {
    console.log("scroll", props.watchValue, props.view);
    if (scroller && oldView !== props.view && props.watchValue) {
      nextTick(scroller.scroll_instant());
      oldView = props.view;
    } else if (scroller && props.watchValue) {
      nextTick(scroller.print(props.animate || false));
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
