import { defineStore } from "pinia";

export type SettingsStoreType = {
  avatarSize: number;
  titleNotifications: boolean;
  minimumPageComments: number;
  activityDisplayUsername: boolean;
  nickname: string;
  ignoredUsers: Array<number>;
};

export const useSettingsStore = defineStore({
  id: "settings",
  state: () =>
    ({
      avatarSize: 128,
      titleNotifications: true,
      minimumPageComments: 30,
      activityDisplayUsername: true,
      nickname: "",
      ignoredUsers: [],
    } as SettingsStoreType),
});
