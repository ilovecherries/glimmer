<script setup lang="ts">
import { sendRequest } from "@/lib/helpers";
import { ref } from "@vue/runtime-dom";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import ThreadImage from "@/assets/SB-thread.png";
import type { User, Content } from "contentapi-ts-bindings/Views";
import { api } from "@/lib/qcs/qcs";
import {
  SearchRequest,
  SearchRequests,
} from "contentapi-ts-bindings/Search/SearchRequests";
import { RequestType } from "contentapi-ts-bindings/Search/RequestType";

const settings = useSettingsStore();
const { avatarSize } = storeToRefs(settings);

let query = "";

let users = ref<undefined | User[]>(undefined);
let contents = ref<undefined | Content[]>(undefined);
const limit = 15;

const search = (query: string) => {
  const search = new SearchRequests(
    {
      text: `%${query}%`,
    },
    [
      new SearchRequest(
        RequestType.user,
        "username,id,avatar",
        "username LIKE @text",
        "id",
        limit
      ),
      new SearchRequest(
        RequestType.content,
        "name,id,values",
        "name LIKE @text",
        "id",
        limit
      ),
    ]
  );
  sendRequest(search, (data) => {
    users.value = data.user as User[];
    contents.value = data.content as Content[];
  });
};
</script>

<template>
  <div class="grow w-full overflow-y-scroll">
    <input type="text" v-model="query" class="border border-bcol m-2 w-[80%]" />
    <button @click="search(query)">Search</button>
    <div v-if="contents">
      <h1>Pages</h1>
      <div v-for="c in contents" :key="c.id">
        <img :src="ThreadImage" class="h-6 w-6 border border-bcol inline" />
        <router-link :to="`/page/${c.id}`" class="inline">{{
          c.name
        }}</router-link>
      </div>
    </div>
    <div v-if="users">
      <h1>Users</h1>
      <div v-for="u in users" :key="u.id">
        <img
          :src="api.getFileURL(u.avatar, avatarSize)"
          class="h-6 w-6 border border-bcol inline"
        />
        <router-link :to="`/user/${u.id}`" class="inline">{{
          u.username
        }}</router-link>
      </div>
    </div>
  </div>
</template>
