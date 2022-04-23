<script setup lang="ts">
import { sendRequest } from '@/lib/helpers';
import { RequestParameter } from '@/lib/qcs/types/RequestParameter';
import { RequestSearchParameter } from '@/lib/qcs/types/RequestSearchParameter';
import type { User } from '@/lib/qcs/types/User';
import { ref } from '@vue/runtime-dom';
import { avatarUrl } from '@/lib/qcs/types/User';
import { useSettingsStore } from '@/stores/settings';
import { storeToRefs } from 'pinia';

const settings = useSettingsStore();
const { avatarSize } = storeToRefs(settings);

let query = "";

let users = ref<undefined | User[]>(undefined);
const limit = 15

const search = () => {
  const search = new RequestParameter(
    {
      text: `%${query}%`,
    },
    [
      new RequestSearchParameter(
        "user",
        "username,id,avatar",
        "username LIKE @text",
        "id",
        limit
      ),
      new RequestSearchParameter(
        "content",
        "name,id,values",
        "name LIKE @text",
        "id",
        limit
      ),
    ]
  );
  sendRequest(search, (data) => {
    console.log(data)
    users.value = data.user;
  });
};
</script>

<template>
  <div class="grow w-full">
    <input
      type="text"
      v-model="query"
      class="border border-black m-2 w-[80%]"
    />
    <button @click="search">Search</button>
    <div v-if="users">
      <h1>Users</h1>
      <div v-for="u in users" :key="u.id">
        <img
          :src="avatarUrl(u.avatar, avatarSize)"
          class="h-6 w-6 border border-black inline"
        />
        <div class="inline">{{ u.username }}</div>
      </div>
    </div>
  </div>
</template>