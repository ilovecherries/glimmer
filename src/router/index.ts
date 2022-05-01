import PageEditView from "@/views/PageEditView.vue";
import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import PageView from "../views/PageView.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/page/:id",
      name: "page",
      component: PageView,
      props: true,
    },
    {
      path: "/edit-page/:id",
      name: "edit-page",
      component: PageEditView,
      props: true,
    },
  ],
});

export default router;
