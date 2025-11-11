import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordRaw } from "vue-router";
import Rankings from "@/views/Rankings.vue";
import CountryRankings from "@/views/CountryRankings.vue";
import TournamentsList from "@/views/TournamentsList.vue";
import Player from "@/views/Player.vue";
import Imprint from "@/views/Imprint.vue";
import MatchDetail from "@/views/MatchDetail.vue";
import Matches from "@/views/Matches.vue";
import Faq from "@/views/Faq.vue";
import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import LauncherSetup from "@/components/setup-guides/LauncherSetup.vue";
import InstallingWar3 from "@/components/setup-guides/InstallingWar3.vue";
import SetupGuidesContainer from "@/components/SetupGuidesContainer.vue";
import PlayerArrangedTeamsTab from "@/components/player/tabs/PlayerArrangedTeamsTab.vue";
import ClanOverview from "@/components/clans/ClanOverview.vue";
import PlayerMatchesTab from "@/components/player/tabs/PlayerMatchesTab.vue";
import PlayerProfileTab from "@/components/player/tabs/PlayerProfileTab.vue";
import TournamentDetail from "@/views/TournamentDetail.vue";
import Admin from "@/views/Admin.vue";
import Rewards from "@/views/Rewards.vue";
import PatreonCallback from "@/views/PatreonCallback.vue";
import { EAdminRouteName, EMainRouteName, EPlayerRouteName, ESetupGuideRouteName, EStatisticsRouteName } from "./types";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: EMainRouteName.HOME,
    component: Home,
  },
  {
    path: "/login",
    name: EMainRouteName.LOGIN,
    component: Login,
    props: (route: { query: { code: string } }) => ({ code: route.query.code }),
  },
  {
    path: "/faq",
    component: Faq,
    children: [
      {
        path: "",
        name: EMainRouteName.FAQ,
        component: Faq,
      },
      {
        path: "setup-guides",
        component: SetupGuidesContainer,
        children: [
          {
            path: "",
            redirect: "launcher-setup",
          },
          {
            path: "launcher-setup",
            name: ESetupGuideRouteName.LAUNCHER_SETUP,
            component: LauncherSetup,
          },
          {
            path: "installing-war3",
            name: ESetupGuideRouteName.INSTALLING_WAR3,
            component: InstallingWar3,
          },
        ],
      },
    ],
  },
  {
    path: "/getting-started",
    redirect: "/faq/setup-guides",
  },
  {
    path: "/setup-guides",
    redirect: "/faq/setup-guides",
  },
  {
    path: "/setup-guides/launcher-setup",
    redirect: "/faq/setup-guides/launcher-setup",
  },
  {
    path: "/setup-guides/installing-war3",
    redirect: "/faq/setup-guides/installing-war3",
  },
  {
    path: "/imprint",
    name: EMainRouteName.IMPRINT,
    component: Imprint,
  },
  {
    path: "/rankings",
    name: EMainRouteName.RANKINGS,
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
    name: EMainRouteName.COUNTRY_RANKINGS,
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
        name: EPlayerRouteName.PLAYER_PROFILE,
        props: true,
        component: PlayerProfileTab,
      },
      {
        path: "matches",
        name: EPlayerRouteName.PLAYER_PROFILE_MATCHES,
        props: true,
        component: PlayerMatchesTab,
      },
      {
        path: "at-teams",
        name: EPlayerRouteName.PLAYER_PROFILE_TEAMS,
        component: PlayerArrangedTeamsTab,
      },
      {
        path: "statistics",
        name: EPlayerRouteName.PLAYER_PROFILE_STATISTICS,
        component: () => import("@/components/player/tabs/PlayerStatisticTab.vue"),
      },
      {
        path: "clan",
        name: EPlayerRouteName.PLAYER_PROFILE_CLAN,
        props: true,
        component: ClanOverview,
      },
    ],
  },
  {
    path: "/match/:matchId",
    name: EMainRouteName.MATCH,
    props: true,
    component: MatchDetail,
  },
  {
    path: "/matches",
    name: EMainRouteName.MATCHES,
    component: Matches,
  },
  {
    path: "/OverallStatistics",
    component: () => import("@/views/OverallStatistics.vue"),
    name: EMainRouteName.OVERALL_STATISTICS,
    redirect: { name: EStatisticsRouteName.PLAYER_ACTIVITY },
    children: [
      {
        path: "",
        component: () => import("@/components/overall-statistics/tabs/PlayerActivityTab.vue"),
        name: EStatisticsRouteName.PLAYER_ACTIVITY,
      },
      {
        path: "mmr-distribution",
        name: EStatisticsRouteName.MMR,
        component: () => import("@/components/overall-statistics/tabs/MmrDistributionTab.vue"),
      },
      {
        path: "winrates-per-race-and-map",
        name: EStatisticsRouteName.WINRATES,
        component: () => import("@/components/overall-statistics/tabs/WinratesTab.vue"),
      },
      {
        path: "heroes-winrates",
        name: EStatisticsRouteName.HEROES,
        component: () => import("@/components/overall-statistics/tabs/HeroTab.vue"),
      },
    ],
  },
  {
    path: "/admin",
    name: EMainRouteName.ADMIN,
    component: Admin,
    children: [
      { path: "admin-queue-data", name: EAdminRouteName.LIVE_QUEUE_DATA, component: () => import("@/components/admin/AdminQueueData.vue") },
      { path: "admin-banned-players", name: EAdminRouteName.BANNED_PLAYERS, component: () => import("@/components/admin/AdminBannedPlayers.vue") },
      { path: "admin-ban-reason-translations", name: EAdminRouteName.BAN_REASON_TRANSLATIONS, component: () => import("@/components/admin/AdminBanReasonTranslations.vue") },
      { path: "admin-smurfs", name: EAdminRouteName.SMURF_CHECKER_QUERY, component: () => import("@/components/admin/AdminSmurfs.vue") },
      { path: "admin-smurfs-manage-identifiers", name: EAdminRouteName.SMURF_CHECKER_MANAGE_IDENTIFIERS, component: () => import("@/components/admin/AdminSmurfManageIdentifiers.vue") },
      { path: "admin-global-mute", name: EAdminRouteName.GLOBAL_MUTE, component: () => import("@/components/admin/AdminGlobalMute.vue") },
      { path: "admin-lounge-mute", name: EAdminRouteName.LOUNGE_MUTE, component: () => import("@/components/admin/AdminLoungeMute.vue") },
      { path: "admin-view-game-chat", name: EAdminRouteName.VIEW_GAME_CHAT, component: () => import("@/components/admin/AdminViewGameChat.vue") },
      { path: "admin-proxies", name: EAdminRouteName.PROXY_SETTINGS, component: () => import("@/components/admin/AdminProxies.vue") },
      { path: "admin-news-for-launcher", name: EAdminRouteName.NEWS, component: () => import("@/components/admin/AdminNewsForLauncher.vue") },
      { path: "admin-loading-screen-tips", name: EAdminRouteName.LOADING_SCREEN_TIPS, component: () => import("@/components/admin/AdminLoadingScreenTips.vue") },
      { path: "admin-motd", name: EAdminRouteName.MESSAGE_OF_THE_DAY, component: () => import("@/components/admin/AdminMotd.vue") },
      { path: "admin-rewards", name: EAdminRouteName.MANAGE_REWARDS, component: () => import("@/components/admin/AdminRewards.vue") },
      { path: "admin-product-mappings", name: EAdminRouteName.PRODUCT_MAPPINGS, component: () => import("@/components/admin/AdminProductMappings.vue") },
      { path: "admin-assignments", name: EAdminRouteName.REWARD_ASSIGNMENTS, component: () => import("@/components/admin/AdminAssignments.vue") },
      { path: "admin-patreon-links", name: EAdminRouteName.PATREON_LINKS, component: () => import("@/components/admin/AdminPatreonLinks.vue") },
      { path: "admin-drift-detection", name: EAdminRouteName.DRIFT_DETECTION, component: () => import("@/components/admin/AdminDriftDetection.vue") },
      { path: "admin-assign-portraits", name: EAdminRouteName.ASSIGN_PORTRAITS, component: () => import("@/components/admin/AdminAssignPortraits.vue") },
      { path: "admin-manage-portraits", name: EAdminRouteName.MANAGE_PORTRAITS, component: () => import("@/components/admin/AdminManagePortraits.vue") },
      { path: "admin-storage-alibaba", name: EAdminRouteName.MANAGE_ALIBABA_FILES, component: () => import("@/components/admin/cloudStorage/AdminStorageAlibaba.vue") },
      { path: "admin-storage-s3", name: EAdminRouteName.MANAGE_S3_FILES, component: () => import("@/components/admin/cloudStorage/AdminStorageS3.vue") },
      { path: "admin-maps", name: EAdminRouteName.MANAGE_MAPS, component: () => import("@/components/admin/AdminMaps.vue") },
      { path: "admin-tournaments", name: EAdminRouteName.MANAGE_TOURNAMENTS, component: () => import("@/components/admin/AdminTournaments.vue") },
      { path: "admin-permissions", name: EAdminRouteName.MANAGE_PERMISSIONS, component: () => import("@/components/admin/AdminPermissions.vue") },
      { path: "admin-api-tokens", name: EAdminRouteName.MANAGE_API_TOKENS, component: () => import("@/components/admin/AdminApiTokens.vue") },
      { path: "admin-server-logs", name: EAdminRouteName.VIEW_SERVER_LOGS, component: () => import("@/components/admin/AdminServerLogs.vue") },
      { path: "admin-server-logs/:logFileName", name: EAdminRouteName.SERVER_LOG, component: () => import("@/components/admin/AdminServerLog.vue"), props: true },
    ],
  },
  {
    path: "/rewards",
    name: EMainRouteName.REWARDS,
    component: Rewards,
  },
  {
    path: "/patreon/callback",
    name: EMainRouteName.PATREON_CALLBACK,
    component: PatreonCallback,
  },
  {
    path: "/tournaments",
    name: EMainRouteName.TOURNAMENTS,
    component: TournamentsList,
  },
  {
    path: "/tournaments/:tournamentId",
    name: EMainRouteName.TOURNAMENT,
    props: true,
    component: TournamentDetail,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const documentTitle = (pageName: string | null | undefined) => pageName ? `${pageName} | W3Champions` : "W3Champions";

router.afterEach((to: RouteLocationNormalized) => {
  document.title = documentTitle(to.name as string);
});

export default router;
