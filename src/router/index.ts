import { createRouter, createWebHashHistory } from "vue-router";
const PageEditView = () => import("@/views/PageEditView.vue");
const HomeView = () => import("../views/HomeView.vue");
const PageView = () => import("../views/PageView.vue");

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
