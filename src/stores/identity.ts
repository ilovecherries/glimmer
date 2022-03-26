import { defineStore } from "pinia";
import { API_DOMAIN } from "@/lib/qcs/qcs";
import type { TokenStatus } from "@/lib/qcs/types/TokenStatus";
import { RequestParameter } from "@/lib/qcs/types/RequestParameter";
import { RequestSearchParameter } from "@/lib/qcs/types/RequestSearchParameter";
import type { SearchResult } from "@/lib/qcs/types/SearchResult";
import { avatarUrl } from "@/lib/qcs/types/User";

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
        const statusReq = await fetch(
          `https://${API_DOMAIN}/api/Status/token`,
          {
            headers: this.headers,
          }
        );
        const status: TokenStatus = await statusReq.json();
        this.id = status.userId;
        const search = new RequestParameter(
          {
            uid: this.id,
            type: 3,
          },
          [
            new RequestSearchParameter("user", "*", "id = @uid"),
            // new RequestSearchParameter(
            //   "content",
            //   "*",
            //   "createUserId = @uid and contentType = @type",
            //   "id_desc",
            //   100,
            //   0
            // ),
          ]
        );
        const userReq = await fetch(`https://${API_DOMAIN}/api/Request`, {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(search),
        });
        const searchResult: SearchResult = await userReq.json();
        const user = searchResult.data.user?.shift();
        if (user) {
          this.username = user.username;
          this.avatar = user.avatar;
          this.loggedIn = true;
        } else {
          throw new Error("Couldn't find user in DB");
        }
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
