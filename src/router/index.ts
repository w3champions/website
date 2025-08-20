import Vue from "vue";
import VueRouter, { Route, RouteConfig } from "vue-router";
import Rankings from "@/views/Rankings.vue";
import CountryRankings from "@/views/CountryRankings.vue";
import TournamentsList from "@/views/TournamentsList.vue";
import Player from "@/views/Player.vue";
import Imprint from "@/views/Imprint.vue";
import MatchDetail from "@/views/MatchDetail.vue";
import Matches from "@/views/Matches.vue";
import OverallStatistics from "@/views/OverallStatistics.vue";
import SetupGuides from "@/views/SetupGuides.vue";
import Faq from "@/views/Faq.vue";
import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import LauncherSetup from "@/components/setup-guides/LauncherSetup.vue";
import InstallingWar3 from "@/components/setup-guides/InstallingWar3.vue";
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
import AdminSmurfs from "@/components/admin/AdminSmurfs.vue";
import AdminSmurfManageIdentifiers from "@/components/admin/AdminSmurfManageIdentifiers.vue";
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
import AdminServerLog from "@/components/admin/AdminServerLog.vue";
import Rewards from "@/views/Rewards.vue";
import PatreonCallback from "@/views/PatreonCallback.vue";
import { EAdminRouteName, EStatisticsRouteName, ESetupGuidesRouteName } from "./types";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
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
    redirect: { name: ESetupGuidesRouteName.LAUNCHER_SETUP },
  },
  {
    path: "/setup-guides",
    component: SetupGuides,
    name: "Setup Guides",
    redirect: { name: ESetupGuidesRouteName.LAUNCHER_SETUP },
    children: [
      {
        path: "launcher-setup",
        component: LauncherSetup,
        name: ESetupGuidesRouteName.LAUNCHER_SETUP,
      },
      {
        path: "installing-war3",
        component: InstallingWar3,
        name: ESetupGuidesRouteName.INSTALLING_WAR3,
      }
    ],
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
    children: [
      {
        path: "",
        name: "Player Profile",
        props: true,
        component: PlayerProfileTab,
      },
      {
        path: "matches",
        name: "Player Profile - Matches",
        props: true,
        component: PlayerMatchesTab,
      },
      {
        path: "at-teams",
        name: "Player Profile - Teams",
        component: PlayerArrangedTeamsTab,
      },
      {
        path: "statistics",
        name: "Player Profile - Statistics",
        component: PlayerStatisticTab,
      },
      {
        path: "clan",
        name: "Player Profile - Clan",
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
    redirect: { name: EStatisticsRouteName.PLAYER_ACTIVITY },
    children: [
      {
        path: "",
        component: PlayerActivityTab,
        name: EStatisticsRouteName.PLAYER_ACTIVITY,
      },
      {
        path: "mmr-distribution",
        name: EStatisticsRouteName.MMR,
        component: MmrDistributionTab,
      },
      {
        path: "winrates-per-race-and-map",
        name: EStatisticsRouteName.WINRATES,
        component: WinrateTab,
      },
      {
        path: "heroes-winrates",
        name: EStatisticsRouteName.HEROES,
        component: HeroTab,
      },
    ],
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    children: [
      { path: "admin-queue-data", name: EAdminRouteName.LIVE_QUEUE_DATA, component: AdminQueueData },
      { path: "admin-banned-players", name: EAdminRouteName.BANNED_PLAYERS, component: AdminBannedPlayers },
      { path: "admin-smurfs", name: EAdminRouteName.SMURF_CHECKER_QUERY, component: AdminSmurfs },
      { path: "admin-smurfs-manage-identifiers", name: EAdminRouteName.SMURF_CHECKER_MANAGE_IDENTIFIERS, component: AdminSmurfManageIdentifiers },
      { path: "admin-global-mute", name: EAdminRouteName.GLOBAL_MUTE, component: AdminGlobalMute },
      { path: "admin-lounge-mute", name: EAdminRouteName.LOUNGE_MUTE, component: AdminLoungeMute },
      { path: "admin-view-game-chat", name: EAdminRouteName.VIEW_GAME_CHAT, component: AdminViewGameChat },
      { path: "admin-proxies", name: EAdminRouteName.PROXY_SETTINGS, component: AdminProxies },
      { path: "admin-news-for-launcher", name: EAdminRouteName.NEWS, component: AdminNewsForLauncher },
      { path: "admin-loading-screen-tips", name: EAdminRouteName.LOADING_SCREEN_TIPS, component: AdminLoadingScreenTips },
      { path: "admin-motd", name: EAdminRouteName.MESSAGE_OF_THE_DAY, component: AdminMotd },
      { path: "admin-assign-portraits", name: EAdminRouteName.ASSIGN_PORTRAITS, component: AdminAssignPortraits },
      { path: "admin-manage-portraits", name: EAdminRouteName.MANAGE_PORTRAITS, component: AdminManagePortraits },
      { path: "admin-storage-alibaba", name: EAdminRouteName.MANAGE_ALIBABA_FILES, component: AdminStorageAlibaba },
      { path: "admin-storage-s3", name: EAdminRouteName.MANAGE_S3_FILES, component: AdminStorageS3 },
      { path: "admin-maps", name: EAdminRouteName.MANAGE_MAPS, component: AdminMaps },
      { path: "admin-tournaments", name: EAdminRouteName.MANAGE_TOURNAMENTS, component: AdminTournaments },
      { path: "admin-permissions", name: EAdminRouteName.MANAGE_PERMISSIONS, component: AdminPermissions },
      { path: "admin-server-logs", name: EAdminRouteName.VIEW_SERVER_LOGS, component: AdminServerLogs },
      { path: "admin-server-logs/:logFileName", name: EAdminRouteName.SERVER_LOG, component: AdminServerLog, props: true },
    ],
  },
  {
    path: "/rewards",
    name: "Rewards",
    component: Rewards,
  },
  {
    path: "/patreon/callback",
    name: "PatreonCallback",
    component: PatreonCallback,
  },
  {
    path: "/tournaments",
    name: "Tournaments",
    component: TournamentsList,
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

const documentTitle = (pageName: string | null | undefined) => pageName ? `${pageName} | W3Champions` : "W3Champions";

router.afterEach((to: Route) => {
  document.title = documentTitle(to.name);
});

export default router;
