import Vue from "vue";
import VueRouter from "vue-router";
import Rankings from "@/views/Rankings.vue";
import Tournaments from "@/views/Tournaments.vue";
import Player from "@/views/Player.vue";
import Imprint from "@/views/Imprint.vue";
import MatchDetail from "@/views/MatchDetail.vue";
import Matches from "@/views/Matches.vue";
import OverallStatistics from "@/views/OverallStatistics.vue";
import Admin from "@/views/Admin.vue";
import GettingStarted from "@/views/GettingStarted.vue";
import Faq from "@/views/Faq.vue";
import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import PlayerArrangedTeamsTab from "@/components/player/tabs/PlayerArrangedTeamsTab.vue";
import PlayerStatisticTab from "@/components/player/tabs/PlayerStatisticTab.vue";
import ClanOverview from "@/components/clans/ClanOverview.vue";
import PlayerMatchesTab from "@/components/player/tabs/PlayerMatchesTab.vue";
import PlayerProfileTab from "@/components/player/tabs/PlayerProfileTab.vue";
import PlayerActivityTab from "@/components/overal-statistics/tabs/PlayerActivityTab.vue";
import WinrateTab from "@/components/overal-statistics/tabs/WinratesTab.vue";
import MmrDistributionTab from "@/components/overal-statistics/tabs/MmrDistributionTab.vue";
import HeroTab from "@/components/overal-statistics/tabs/HeroTab.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    props: (route: { query: { code: string } }) => ({ code: route.query.code }),
  },
  {
    path: "/faq",
    name: "FAQ",
    component: Faq,
  },
  {
    path: "/getting-started",
    name: "GettingStarted",
    component: GettingStarted,
  },
  {
    path: "/imprint",
    name: "Imprint",
    component: Imprint,
  },
  {
    path: "/rankings",
    name: "Rankings",
    props: (route: {
      query: {
        season: string;
        gateway: string;
        gamemode: string;
        league: string;
        playerId: string;
      };
    }) => ({
      gamemode: parseInt(route.query.gamemode),
      gateway: parseInt(route.query.gateway),
      league: parseInt(route.query.league),
      season: parseInt(route.query.season),
      playerId: route.query.playerId,
    }),
    component: Rankings,
  },
  {
    path: "/player/:id",
    component: Player,
    props: true,
    name: "Player",
    children: [
      {
        path: "",
        props: true,
        component: PlayerProfileTab,
      },
      {
        path: "matches",
        props: true,
        component: PlayerMatchesTab,
      },
      {
        path: "at-teams",
        component: PlayerArrangedTeamsTab,
      },
      {
        path: "statistics",
        component: PlayerStatisticTab,
      },
      {
        path: "clan",
        props: true,
        component: ClanOverview,
      },
    ],
  },
  {
    path: "/match/:matchId",
    name: "Match",
    props: true,
    component: MatchDetail,
  },
  {
    path: "/matches",
    name: "Matches",
    component: Matches,
  },
  {
    path: "/OverallStatistics",
    name: "OverallStatistics",
    component: OverallStatistics,
    children: [
      {
        path: "/",
        component: PlayerActivityTab,
      },
      {
        path: "mmr-distribution",
        component: MmrDistributionTab,
      },
      {
        path: "winrates-per-race-and-map",
        component: WinrateTab,
      },
      {
        path: "heroes-winrates",
        component: HeroTab,
      },
    ],
  },
  {
    path: "/AdminOnlyView",
    name: "Admin",
    component: Admin,
  },
  {
    path: "/tournaments",
    name: "Tournaments",
    component: Tournaments,
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
