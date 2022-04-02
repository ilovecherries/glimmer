import { defineStore } from "pinia";
import { API_DOMAIN } from "@/lib/qcs/qcs";
import { avatarUrl, type User } from "@/lib/qcs/types/User";

export const useIdentityStore = defineStore({
  id: "identity",
  state: () => ({
    token: "",
    id: 0,
    username: "",
    avatar: "0",
    loggedIn: false,
  }),
  getters: {
    avatarUrl: (state) => avatarUrl(state.avatar),
    headers: (state) => ({
      Authorization: `Bearer ${state.token}`,
      "Content-Type": "application/json",
    }),
  },
  actions: {
    async refresh(token?: string) {
      if (token) this.token = token;

      try {
        const meReq = await fetch(`https://${API_DOMAIN}/api/User/me`, {
          headers: this.headers,
        });
        const user: User = await meReq.json();
        this.username = user.username;
        this.avatar = user.avatar;
        this.loggedIn = true;
      } catch (err) {
        console.error(err);
      }
    },
    async login(username: string, password: string) {
      try {
        const req = await fetch(`https://${API_DOMAIN}/api/User/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });
        switch (req.status) {
          case 200: {
            const token = await req.text();
            await this.refresh(token);
            break;
          }
          default:
            throw Error(`Login failed\n${req.statusText}`);
        }
      } catch (err) {
        console.error(err);
      }
    },
    logout() {
      this.$reset();
    },
  },
  persist: true,
  share: {
    enable: true,
    initialize: true,
  },
});
