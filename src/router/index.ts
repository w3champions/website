import Vue from "vue";
import VueRouter from "vue-router";
import { Gateways } from "@/store/ranking/types";
import { EGameMode } from "@/store/typings";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import(/* webpackChunkName: "home" */ "../views/Home.vue"),
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
    path: "/getting-started",
    name: "GettingStarted",
    component: () => import(/* webpackChunkName: "faq" */ "../views/GettingStarted.vue"),
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
    props: (route: { query: { season: string, gateway: string, gamemode: string, league: string } }) => ({ gamemode: parseInt(route.query.gamemode), gateway: parseInt(route.query.gateway), league: parseInt(route.query.league), season: parseInt(route.query.season) }),
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
  {
    path: "/AdminOnlyView",
    name: "Admin",
    component: () =>
      import(
        /* webpackChunkName: "rankings" */ "../views/Admin.vue"
      ),
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
