import { CommentMarkup } from "@/lib/qcs/types/Comment";
import { defineStore } from "pinia";

export const THEMES = ["sbs", "dark", "glimmer"];

export type SettingsStoreType = {
  avatarSize: number;
  titleNotifications: boolean;
  commentPagination: number;
  activityDisplayUsername: boolean;
  nickname: string;
  ignoredUsers: Array<number>;
  markup: CommentMarkup;
  theme: string;
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
      theme: "sbs",
    } as SettingsStoreType),
  persist: true,
});
