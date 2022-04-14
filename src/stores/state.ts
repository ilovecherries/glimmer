import { defineStore } from "pinia";

export function uniqueIdGen(): string {
  return String(Math.random()).substring(2);
}

export type ImageViewState = {
  url: string;
  show: boolean;
};

export type StateStoreType = {
  headerText: string;
  uniqueId: string;
  openSidebar: boolean;
  imageView?: ImageViewState;
};

export const useStateStore = defineStore({
  id: "state",
  state: () =>
    ({
      headerText: "Glimmer!",
      uniqueId: uniqueIdGen(),
      openSidebar: true,
      imageView: undefined,
    } as StateStoreType),
});
