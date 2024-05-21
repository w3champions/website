import Vue from "vue";
import VueRouter from "vue-router";
import Rankings from "@/views/Rankings.vue";
import CountryRankings from "@/views/CountryRankings.vue";
import Tournaments from "@/views/Tournaments.vue";
import Player from "@/views/Player.vue";
import Imprint from "@/views/Imprint.vue";
import MatchDetail from "@/views/MatchDetail.vue";
import Matches from "@/views/Matches.vue";
import OverallStatistics from "@/views/OverallStatistics.vue";
import GettingStarted from "@/views/GettingStarted.vue";
import Faq from "@/views/Faq.vue";
import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import PlayerArrangedTeamsTab from "@/components/player/tabs/PlayerArrangedTeamsTab.vue";
import PlayerStatisticTab from "@/components/player/tabs/PlayerStatisticTab.vue";
import ClanOverview from "@/components/clans/ClanOverview.vue";
import PlayerMatchesTab from "@/components/player/tabs/PlayerMatchesTab.vue";
import PlayerProfileTab from "@/components/player/tabs/PlayerProfileTab.vue";
import PlayerActivityTab from "@/components/overall-statistics/tabs/PlayerActivityTab.vue";
import WinrateTab from "@/components/overall-statistics/tabs/WinratesTab.vue";
import MmrDistributionTab from "@/components/overall-statistics/tabs/MmrDistributionTab.vue";
import HeroTab from "@/components/overall-statistics/tabs/HeroTab.vue";
import TournamentDetail from "@/views/TournamentDetail.vue";
import AdminQueueData from "@/components/admin/AdminQueueData.vue";
import AdminBannedPlayers from "@/components/admin/AdminBannedPlayers.vue";
import Admin from "@/views/Admin.vue";
import AdminAlts from "@/components/admin/AdminAlts.vue";
import AdminGlobalMute from "@/components/admin/AdminGlobalMute.vue";
import AdminLoungeMute from "@/components/admin/AdminLoungeMute.vue";
import AdminViewGameChat from "@/components/admin/AdminViewGameChat.vue";
import AdminProxies from "@/components/admin/AdminProxies.vue";
import AdminNewsForLauncher from "@/components/admin/AdminNewsForLauncher.vue";
import AdminLoadingScreenTips from "@/components/admin/AdminLoadingScreenTips.vue";
import AdminMotd from "@/components/admin/AdminMotd.vue";
import AdminAssignPortraits from "@/components/admin/AdminAssignPortraits.vue";
import AdminManagePortraits from "@/components/admin/AdminManagePortraits.vue";
import AdminStorageAlibaba from "@/components/admin/cloudStorage/AdminStorageAlibaba.vue";
import AdminStorageS3 from "@/components/admin/cloudStorage/AdminStorageS3.vue";
import AdminMaps from "@/components/admin/AdminMaps.vue";
import AdminTournaments from "@/components/admin/AdminTournaments.vue";
import AdminPermissions from "@/components/admin/AdminPermissions.vue";
import AdminServerLogs from "@/components/admin/AdminServerLogs.vue";

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
    path: "/countries",
    name: "Country Rankings",
    props: (route: {
      query: {
        season: string;
        gateway: string;
        league: string;
        country: string;
      };
    }) => ({
      gateway: parseInt(route.query.gateway),
      league: parseInt(route.query.league),
      season: parseInt(route.query.season),
      country: route.query.country,
    }),
    component: CountryRankings,
  },
  {
    path: "/player/:id",
    component: Player,
    props: (route: {
      query: {
        freshLogin?: "true";
      };
      params: {
        id: string;
      };
    }) => ({
      freshLogin: route.query.freshLogin === "true",
      id: route.params.id,
    }),
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
    component: OverallStatistics,
    name: "OverallStatistics",
    redirect: { name: "OverallStatisticsPlayerActivity" },
    children: [
      {
        path: "",
        component: PlayerActivityTab,
        name: "OverallStatisticsPlayerActivity",
      },
      {
        path: "mmr-distribution",
        name: "OverallStatisticsDistribution",
        component: MmrDistributionTab,
      },
      {
        path: "winrates-per-race-and-map",
        name: "OverallStatisticsWinrates",
        component: WinrateTab,
      },
      {
        path: "heroes-winrates",
        name: "OverallStatisticsHeroesWinrates",
        component: HeroTab,
      },
    ],
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    children: [
      { path: "admin-queue-data", name: "Live Queue Data", component: AdminQueueData },
      { path: "admin-banned-players", name: "Banned Players", component: AdminBannedPlayers },
      { path: "admin-alts", name: "Smurf Checker", component: AdminAlts },
      { path: "admin-global-mute", name: "Global Mute", component: AdminGlobalMute },
      { path: "admin-lounge-mute", name: "Lounge Mute", component: AdminLoungeMute },
      { path: "admin-view-game-chat", name: "View Game Chat", component: AdminViewGameChat },
      { path: "admin-proxies", name: "Proxy Settings", component: AdminProxies },
      { path: "admin-news-for-launcher", name: "News", component: AdminNewsForLauncher },
      { path: "admin-loading-screen-tips", name: "Loading Screen Tips", component: AdminLoadingScreenTips },
      { path: "admin-motd", name: "Message Of The Day", component: AdminMotd },
      { path: "admin-assign-portraits", name: "Assign Portraits", component: AdminAssignPortraits },
      { path: "admin-manage-portraits", name: "Manage Portraits", component: AdminManagePortraits },
      { path: "admin-storage-alibaba", name: "Manage Alibaba Files", component: AdminStorageAlibaba },
      { path: "admin-storage-s3", name: "Manage S3 Files", component: AdminStorageS3 },
      { path: "admin-maps", name: "Manage Maps", component: AdminMaps },
      { path: "admin-tournaments", name: "Manage Tournaments", component: AdminTournaments },
      { path: "admin-permissions", name: "Manage Permissions", component: AdminPermissions },
      { path: "admin-server-logs", name: "View Server Logs", component: AdminServerLogs },
    ],
  },
  {
    path: "/tournaments",
    name: "Tournaments",
    component: Tournaments,
  },
  {
    path: "/tournaments/:tournamentId",
    name: "Tournament",
    props: true,
    component: TournamentDetail,
  },
];

const router = new VueRouter({
  mode: "history",
  routes,
});

export default router;
