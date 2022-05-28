<script setup lang="ts">
import { ref } from 'vue';

let open = ref(false);
</script>

<template>
  <button @click="open = !open" class="px-4">📷</button>
  <teleport to="#main-content">
    <div v-if="open" class="absolute">
      <div class="z-30 top-0 left-0 w-full h-full bg-black">
        oaisjdoisadj
      </div>
    </div>
  </teleport>
</template>