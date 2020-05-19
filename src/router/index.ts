import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import(/* webpackChunkName: "home" */ "../views/Chat.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/Login.vue"),
    props: (route: { query: { code: string } }) => ({ code: route.query.code }),
  },
  {
    path: "/faq",
    name: "FAQ",
    component: () => import(/* webpackChunkName: "faq" */ "../views/Faq.vue"),
  },
  {
    path: "/imprint",
    name: "Imprint",
    component: () =>
      import(/* webpackChunkName: "home" */ "../views/Imprint.vue"),
  },
  {
    path: "/rankings",
    name: "Rankings",
    component: () =>
      import(/* webpackChunkName: "rankings" */ "../views/Rankings.vue"),
  },
  {
    path: "/player/:id",
    name: "Player",
    props: true,
    component: () =>
      import(/* webpackChunkName: "rankings" */ "../views/Player.vue"),
  },
  {
    path: "/match/:matchId",
    name: "Match",
    props: true,
    component: () =>
      import(/* webpackChunkName: "rankings" */ "../views/MatchDetail.vue"),
  },
  {
    path: "/matches",
    name: "Matches",
    component: () =>
      import(/* webpackChunkName: "rankings" */ "../views/Matches.vue"),
  },
  {
    path: "/OverallStatistics",
    name: "OverallStatistics",
    component: () =>
      import(
        /* webpackChunkName: "rankings" */ "../views/OverallStatistics.vue"
      ),
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
