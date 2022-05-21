<script setup lang="ts">
import { render, sendRequest } from '@/lib/helpers';
import { ContentState, useSharedStore } from '@/stores/shared';
import { InternalContentType } from 'contentapi-ts-bindings/Enums';
import { getUserPageRequest } from 'contentapi-ts-bindings/Helpers';
import type { GetUserPageResult } from 'contentapi-ts-bindings/Helpers';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { api } from "@/lib/qcs";
import MarkupRender from '@/components/MarkupRender.vue';
import { useRoute } from 'vue-router';
import { useStateStore } from '@/stores/state';

const shared = useSharedStore();
const state = useStateStore();
const route = useRoute();
const { contents, users } = storeToRefs(shared);
const { headerText } = storeToRefs(state);

let contentId = ref(-1);
let userId = ref(-1);

watch(
  () => route.params.userId,
  async (newId) => {
  if (newId === undefined) {
    contentId.value = -1;
    userId.value = -1;
    return;
  }
  const uid = parseInt(newId as string);
  console.log(uid);
  const cid = parseInt(Object.keys(contents.value).find(
    x => {
      const data = contents.value[parseInt(x)].data;
      return data.createUserId === uid &&
        data.contentType === InternalContentType.userpage;
    }
  ) || "0");
  if (
    users.value[uid] !== undefined &&
    contents.value[cid] !== undefined && 
    contents.value[cid].state === ContentState.full
  ) {
    contentId.value = cid;
    userId.value = uid;
    headerText.value = users.value[uid].username;
    return;
  } else {
    const search = getUserPageRequest(uid);
    await sendRequest<GetUserPageResult>(search, (data) => {
      const page = data.content?.shift();
      if (page) {
        shared.addContent(page, ContentState.full);
        data.user?.map(shared.addUser);
        headerText.value = users.value[uid].username;
        contentId.value = page.id;
        userId.value = uid;
      } else {
        contentId.value = -1;
        userId.value = -1;
        throw new Error("Page wasn't returned from the API.");
      }
    })
  }
}, { immediate: true })
</script>

<template>
  <main class="h-full flex flex-col">
    <div
      class="p-2 flex flex-col w-full h-full overflow-scroll grow"
      v-if="userId !== -1">
      <div class="flex gap-2 ">
        <img class="w-24 h-24 shrink-0"
          :src="api.getFileURL(users[userId]?.avatar, 128)"
          :alt="`${users[userId]?.username}'s avatar`" />
        <div class="grow flex flex-col">
          <div class="flex gap-2">
            <div class="text-3xl font-bold">{{ users[userId]?.username || "Unknown" }}</div>
            <div class="text-l" v-show="users[userId]?.super === 1">
              ⭐️
            </div>
            <div>(uid: {{ users[userId]?.id }})</div>
          </div>
            <div>Join Date: {{ new Date(users[userId]?.createDate).toLocaleDateString() }}</div>
          <div>
          </div>
          <span>
            [<router-link :to="`/edit-page/${contentId}`">Edit Userpage</router-link>]
          </span>
        </div>
      </div>
      <div class="min-h-max p-4">
        <MarkupRender
          :content="contents[contentId]?.data?.text || '...'"
          :lang="contents[contentId]?.data?.values?.markupLang"
          :render="render"
        />
      </div>
    </div>
    <div v-else>
      Couldn't find user or page
    </div>
  </main>
</template>
