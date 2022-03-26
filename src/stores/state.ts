import { defineStore } from "pinia";

export function uniqueIdGen(): string {
  return String(Math.random()).substring(2);
}

export const useStateStore = defineStore({
  id: "state",
  state: () => ({
    headerText: "Glimmer!",
    uniqueId: uniqueIdGen(),
    openSidebar: true,
  }),
});
