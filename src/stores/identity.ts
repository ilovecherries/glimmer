import { defineStore } from "pinia";
import { api } from "@/lib/qcs";
import { ContentAPI_Session } from "contentapi-ts-bindings/dist/Helpers";
import type { User } from "contentapi-ts-bindings/dist/Views/User";
import { AxiosError } from "axios";

interface IdentityStoreState {
  token: string;
  id: number;
  username: string;
  avatar: string;
  loggedIn: boolean;
  session?: ContentAPI_Session;
  user?: User;
}

export const useIdentityStore = defineStore({
  id: "identity",
  state: () =>
    ({
      token: "",
      id: 0,
      username: "",
      avatar: "0",
      loggedIn: false,
      session: undefined,
      user: undefined,
    } as IdentityStoreState),
  getters: {
    avatarUrl: (state) =>
      state.user?.avatar ? api.getFileURL(state.user.avatar, 0) : "",
    headers: (state) => ({
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "application/json",
    }),
    plaintTextHeaders: (state) => ({
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "text/plain",
    }),
    emptyHeaders: (state) => ({
      Authorization: `Bearer ${state.token}`,
    }),
  },
  actions: {
    async refresh(token?: string) {
      if (token) this.token = token;
      this.session = new ContentAPI_Session(api, this.token);
      try {
        let user: User | undefined;
        try {
          user = (await this.session?.getUserInfo()) || undefined;
        } catch (e) {
          if (e instanceof AxiosError) {
            this.logout();
            return;
          }
        }
        if (!user) return;
        this.user = user;
        this.username = user.username;
        this.avatar = user.avatar;
        this.id = user.id;
        this.loggedIn = true;
      } catch (err) {
        console.error(err);
      }
    },
    async login(username: string, password: string) {
      try {
        const token = await api.login(username, password);
        await this.refresh(token);
      } catch (err) {
        console.error(err);
      }
    },
    logout() {
      this.$reset();
    },
  },
  persist: {
    afterRestore: (context) => {
      if (context.store.token) context.store.refresh();
    },
  },
});
