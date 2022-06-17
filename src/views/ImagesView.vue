<script setup="setup" lang="ts">
import { sendRequest } from "@/lib/helpers";
import { InternalContentType } from "contentapi-ts-bindings/Enums";
import { RequestType } from "contentapi-ts-bindings/Search/RequestType";
import {
  SearchRequest,
  SearchRequests,
} from "contentapi-ts-bindings/Search/SearchRequests";
import type { Content, User } from "contentapi-ts-bindings/Views";
import { ref, watch } from "vue";
import { api } from "@/lib/qcs";
import { useRoute, useRouter } from "vue-router";
import { useIdentityStore } from "@/stores/identity";
import { useSharedStore } from "@/stores/shared";
import { storeToRefs } from "pinia";
import { useStateStore } from "@/stores/state";

const identity = useIdentityStore();
const { session } = storeToRefs(identity);
const shared = useSharedStore();
const state = useStateStore();

const route = useRoute();
const router = useRouter();

const limit = 30;

type Result = Pick<Content, "id" | "hash" | "contentType">;

const files = ref([] as Result[]);
const selected = ref(undefined as undefined | Result);

async function refreshPage(page: number, bucket = "") {
  console.log("BUCKET", bucket);
  const search =
    bucket !== ""
      ? new SearchRequests(
          {
            page: ``,
            type: InternalContentType.file,
            value: `"${bucket}"`,
            key: "bucket",
          },
          [
            new SearchRequest(
              RequestType.content,
              "*",
              "contentType = @type and !valuelike(@key,@value)",
              "id_desc",
              limit,
              page * 20
            ),
          ]
        )
      : new SearchRequests(
          {
            page: ``,
            type: InternalContentType.file,
            key: "bucket",
          },
          [
            new SearchRequest(
              RequestType.content,
              "*",
              "contentType = @type and !valuekeynotlike(@key)",
              "id_desc",
              limit,
              page * 20
            ),
          ]
        );
  type QueryResult = {
    content: Result[];
  };
  const data = await sendRequest<QueryResult>(search);
  console.log("PLEASE", data);
  files.value = data.content || [];
}

function changePage(add: number, bucket = route.query.bucket) {
  const newPage = Math.max(
    (parseInt(route.query.page as string) || 0) + add,
    0
  );
  router.push(
    `/${route.name as string}?page=${newPage}${
      bucket ? "&bucket=" + bucket : ""
    }`
  );
}

async function changeAvatar(hash: string) {
  const params: Partial<User> = {
    ...identity.user,
    avatar: hash,
  };
  const user = (await session?.value?.write("user", params)) as User;
  shared.addUser(user);
}

watch(
  () => route.query,
  async (query) => {
    await refreshPage(
      parseInt(query.page as string) || 0,
      (query.bucket as string) || ""
    );
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <main class="h-full flex flex-col w-full">
    <div class="flex flex-wrap shrink-0">
      <div v-for="(i, index) in files" :key="index" @click="selected = i">
        <img :src="api.getFileURL(i.hash, 64)" class="hover:cursor-pointer" />
      </div>
    </div>
    <div>
      <button class="inline" @click="changePage(-1)">&lt;</button>
      <span>{{ (parseInt(route.query.page as string) || 0) + 1 }}</span>
      <button class="inline" @click="changePage(1)">&gt;</button>
    </div>
    <div>
      <span>bucket: </span>
      <input
        name="bucket-name"
        type="text"
        @blur="(e) => changePage(0, (e.target as HTMLInputElement).value)"
      />
    </div>
    <div
      v-if="selected"
      class="overflow-y-scroll grow border-bcol border-t-8 flex gap-2"
    >
      <div>
        <img
          class="max-h-80 max-w-md w-auto h-auto hover:cursor-pointer"
          :src="api.getFileURL(selected.hash)"
          @click="
            state.imageView = {
              url: api.getFileURL(selected.hash),
              show: true,
            }
          "
        />
      </div>
      <div class="flex flex-col">
        <div>id: {{ selected.id }}</div>
        <div>hash: {{ selected.hash }}</div>
        <div>
          link:
          <input type="text" readonly :value="api.getFileURL(selected.hash)" />
        </div>
        <button @click="changeAvatar(selected.hash)">set as avatar</button>
      </div>
    </div>
  </main>
  <div>Hello</div>
</template>
