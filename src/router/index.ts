import { createRouter, createWebHashHistory } from "vue-router";
const PageEditView = () => import("@/views/PageEditView.vue");
const HomeView = () => import("../views/HomeView.vue");
const PageView = () => import("../views/PageView.vue");
const UserView = () => import("../views/UserView.vue");
const CanvasView = () => import("../views/CanvasView.vue");
const ImagesView = () => import("../views/ImagesView.vue");
const CommentsView = () => import("@/views/CommentsView.vue");

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
    },
    {
      path: "/images",
      name: "images",
      component: ImagesView,
    },
    {
      path: "/comments/:id",
      name: "comments",
      component: CommentsView,
    },
  ],
});

export default router;
