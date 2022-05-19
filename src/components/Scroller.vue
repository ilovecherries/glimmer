<script setup lang="ts">
import { nextTick, ref, watch } from "@vue/runtime-dom";
import { Scroller } from "./scroller";

const props = defineProps({
  watchValue: Number,
  view: String,
});

let scroller: Scroller | undefined;
let oldView: string | undefined = undefined;
interface CachedState {
  /**
   * $innerScroll.value.scrollTop
   */
  scroll: number;
  /**
   * watchValue
   */
  watchValue: number;
}
let cachedStates: Record<string, CachedState> = {};

let $outerScroll = ref<null | HTMLDivElement>(null);
let $innerScroll = ref<null | HTMLDivElement>(null);
watch([$outerScroll, $innerScroll], () => {
  if ($outerScroll.value && $innerScroll.value) {
    scroller = new Scroller($outerScroll.value, $innerScroll.value);
  }
});

const updateState = () => {
  const view = props.view;
  const scroll = $innerScroll.value?.scrollTop;
  const watchValue = props.watchValue;
  if (view !== undefined && scroll !== undefined && watchValue !== undefined) {
    cachedStates[view] = {
      scroll,
      watchValue,
    };
  }
};

watch(
  () => props.watchValue,
  () => {
    if (scroller && oldView !== props.view) {
      nextTick(scroller.scroll_instant());
      // if (props.view !== undefined && cachedStates[props.view]) {
      //   console.log("owo");
      //   nextTick(scroller.scroll_instant());
      //   // nextTick(() => {
      //   //   if ($innerScroll.value) {
      //   //     scroller?.scroll_instant();
      //   //   }
      //   // });
      //   // this would be ideal to do, but the problem with this is that it
      //   // relies on updating the state a lot... let me see if this WORKS
      //   // first and then experiment with the scroll event
      //   // if (props.watchValue !== state.watchValue) {
      //   //   $innerScroll.value.scrollTop = $innerScroll.value.scrollHeight;
      //   // } else {
      //   //   $innerScroll.value.scrollTop = state.scroll;
      //   // }
      // } else {
      //   nextTick(() => {
      //     updateState();
      //   });
      // }
      oldView = props.view;
    } else if (scroller && props.watchValue) {
      nextTick(scroller.print(true));
      // nextTick(() => {
      //   scroller?.print(true)();
      //   updateState();
      // });
    }
  }
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
