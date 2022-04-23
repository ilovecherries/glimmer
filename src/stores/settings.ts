import { CommentMarkup } from "@/lib/qcs/types/Comment";
import { defineStore } from "pinia";

export type SettingsStoreType = {
  avatarSize: number;
  titleNotifications: boolean;
  commentPagination: number;
  activityDisplayUsername: boolean;
  nickname: string;
  ignoredUsers: Array<number>;
  markup: CommentMarkup;
};

export const useSettingsStore = defineStore({
  id: "settings",
  state: () =>
    ({
      avatarSize: 128,
      titleNotifications: true,
      commentPagination: 30,
      activityDisplayUsername: true,
      nickname: "",
      ignoredUsers: [],
      markup: CommentMarkup._12y2,
    } as SettingsStoreType),
  persist: true,
});
