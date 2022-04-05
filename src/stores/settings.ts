import { defineStore } from "pinia";

export const useSettingsStore = defineStore({
  id: "settings",
  state: () => ({
    avatarSize: 128,
    titleNotifications: true,
    minimumPageComments: 30,
    activityDisplayUsername: true,
    nickname: "",
  }),
});
