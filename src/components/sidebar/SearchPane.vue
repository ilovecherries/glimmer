<script setup lang="ts">
import { sendRequest } from "@/lib/helpers";
import { ref } from "@vue/runtime-dom";
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import ThreadImage from "@/assets/SB-thread.png";
import type { User, Content } from "contentapi-ts-bindings/dist/Views";
import { api } from "@/lib/qcs";
import {
  SearchRequest,
  SearchRequests,
} from "contentapi-ts-bindings/dist/Search/SearchRequests";
import { RequestType } from "contentapi-ts-bindings/dist/Search/RequestType";
import SearchArea from "../SearchArea.vue";
import type { SearchResult } from "../SearchArea";

const limit = 15;

const search = async (query: string) => {
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
  type QueryResult = {
    user: Array<Pick<User, "username" | "id" | "avatar">>;
    content: Array<Pick<Content, "name" | "id" | "values">>;
  };
  const data = await sendRequest<QueryResult>(search);
  console.log(data);
  const userResults: SearchResult[] =
    data.user?.map((x) => ({
      content: x.username,
      thumbnail: x.avatar,
      link: `/user/${x.id}`,
    })) || [];
  const contentResults: SearchResult[] =
    data.content?.map((x) => ({
      content: x.name,
      thumbnail: x.values.thumbnail,
      link: `/page/${x.id}`,
    })) || [];
  return userResults.concat(contentResults);
};
</script>

<template>
  <div class="grow w-full">
    <SearchArea :search="search" />
    <div>OWO</div>
  </div>
</template>
