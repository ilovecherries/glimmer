import { createRouter, createWebHashHistory } from "vue-router";
const PageEditView = () => import("@/views/PageEditView.vue");
const HomeView = () => import("../views/HomeView.vue");
const PageView = () => import("../views/PageView.vue");
const UserView = () => import("../views/UserView.vue");
const CanvasView = () => import("../views/CanvasView.vue");

export const router = createRouter({
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
    {
      path: "/user/:userId",
      name: "user",
      component: UserView,
      props: true,
    },
    {
      path: "/fore",
      name: "fore",
      component: CanvasView,
      props: true,
    }
  ],
});

export default router;
