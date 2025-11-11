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

const lazyLoaded = {
  PlayerStatisticTab: () => import("@/components/player/tabs/PlayerStatisticTab.vue"),
  OverallStatistics: () => import("@/views/OverallStatistics.vue"),
  PlayerActivityTab: () => import("@/components/overall-statistics/tabs/PlayerActivityTab.vue"),
  MmrDistributionTab: () => import("@/components/overall-statistics/tabs/MmrDistributionTab.vue"),
  WinrateTab: () => import("@/components/overall-statistics/tabs/WinratesTab.vue"),
  HeroTab: () => import("@/components/overall-statistics/tabs/HeroTab.vue"),
  AdminQueueData: () => import("@/components/admin/AdminQueueData.vue"),
  AdminBannedPlayers: () => import("@/components/admin/AdminBannedPlayers.vue"),
  AdminBanReasonTranslations: () => import("@/components/admin/AdminBanReasonTranslations.vue"),
  AdminSmurfs: () => import("@/components/admin/AdminSmurfs.vue"),
  AdminSmurfManageIdentifiers: () => import("@/components/admin/AdminSmurfManageIdentifiers.vue"),
  AdminGlobalMute: () => import("@/components/admin/AdminGlobalMute.vue"),
  AdminLoungeMute: () => import("@/components/admin/AdminLoungeMute.vue"),
  AdminViewGameChat: () => import("@/components/admin/AdminViewGameChat.vue"),
  AdminProxies: () => import("@/components/admin/AdminProxies.vue"),
  AdminNewsForLauncher: () => import("@/components/admin/AdminNewsForLauncher.vue"),
  AdminLoadingScreenTips: () => import("@/components/admin/AdminLoadingScreenTips.vue"),
  AdminMotd: () => import("@/components/admin/AdminMotd.vue"),
  AdminRewards: () => import("@/components/admin/AdminRewards.vue"),
  AdminProductMappings: () => import("@/components/admin/AdminProductMappings.vue"),
  AdminAssignments: () => import("@/components/admin/AdminAssignments.vue"),
  AdminPatreonLinks: () => import("@/components/admin/AdminPatreonLinks.vue"),
  AdminDriftDetection: () => import("@/components/admin/AdminDriftDetection.vue"),
  AdminAssignPortraits: () => import("@/components/admin/AdminAssignPortraits.vue"),
  AdminManagePortraits: () => import("@/components/admin/AdminManagePortraits.vue"),
  AdminStorageAlibaba: () => import("@/components/admin/cloudStorage/AdminStorageAlibaba.vue"),
  AdminStorageS3: () => import("@/components/admin/cloudStorage/AdminStorageS3.vue"),
  AdminMaps: () => import("@/components/admin/AdminMaps.vue"),
  AdminTournaments: () => import("@/components/admin/AdminTournaments.vue"),
  AdminPermissions: () => import("@/components/admin/AdminPermissions.vue"),
  AdminApiTokens: () => import("@/components/admin/AdminApiTokens.vue"),
  AdminServerLogs: () => import("@/components/admin/AdminServerLogs.vue"),
  AdminServerLog: () => import("@/components/admin/AdminServerLog.vue"),
};

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
        component: lazyLoaded.PlayerStatisticTab,
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
    component: lazyLoaded.OverallStatistics,
    name: EMainRouteName.OVERALL_STATISTICS,
    redirect: { name: EStatisticsRouteName.PLAYER_ACTIVITY },
    children: [
      {
        path: "",
        component: lazyLoaded.PlayerActivityTab,
        name: EStatisticsRouteName.PLAYER_ACTIVITY,
      },
      {
        path: "mmr-distribution",
        name: EStatisticsRouteName.MMR,
        component: lazyLoaded.MmrDistributionTab,
      },
      {
        path: "winrates-per-race-and-map",
        name: EStatisticsRouteName.WINRATES,
        component: lazyLoaded.WinrateTab,
      },
      {
        path: "heroes-winrates",
        name: EStatisticsRouteName.HEROES,
        component: lazyLoaded.HeroTab,
      },
    ],
  },
  {
    path: "/admin",
    name: EMainRouteName.ADMIN,
    component: Admin,
    children: [
      { path: "admin-queue-data", name: EAdminRouteName.LIVE_QUEUE_DATA, component: lazyLoaded.AdminQueueData },
      { path: "admin-banned-players", name: EAdminRouteName.BANNED_PLAYERS, component: lazyLoaded.AdminBannedPlayers },
      { path: "admin-ban-reason-translations", name: EAdminRouteName.BAN_REASON_TRANSLATIONS, component: lazyLoaded.AdminBanReasonTranslations },
      { path: "admin-smurfs", name: EAdminRouteName.SMURF_CHECKER_QUERY, component: lazyLoaded.AdminSmurfs },
      { path: "admin-smurfs-manage-identifiers", name: EAdminRouteName.SMURF_CHECKER_MANAGE_IDENTIFIERS, component: lazyLoaded.AdminSmurfManageIdentifiers },
      { path: "admin-global-mute", name: EAdminRouteName.GLOBAL_MUTE, component: lazyLoaded.AdminGlobalMute },
      { path: "admin-lounge-mute", name: EAdminRouteName.LOUNGE_MUTE, component: lazyLoaded.AdminLoungeMute },
      { path: "admin-view-game-chat", name: EAdminRouteName.VIEW_GAME_CHAT, component: lazyLoaded.AdminViewGameChat },
      { path: "admin-proxies", name: EAdminRouteName.PROXY_SETTINGS, component: lazyLoaded.AdminProxies },
      { path: "admin-news-for-launcher", name: EAdminRouteName.NEWS, component: lazyLoaded.AdminNewsForLauncher },
      { path: "admin-loading-screen-tips", name: EAdminRouteName.LOADING_SCREEN_TIPS, component: lazyLoaded.AdminLoadingScreenTips },
      { path: "admin-motd", name: EAdminRouteName.MESSAGE_OF_THE_DAY, component: lazyLoaded.AdminMotd },
      { path: "admin-rewards", name: EAdminRouteName.MANAGE_REWARDS, component: lazyLoaded.AdminRewards },
      { path: "admin-product-mappings", name: EAdminRouteName.PRODUCT_MAPPINGS, component: lazyLoaded.AdminProductMappings },
      { path: "admin-assignments", name: EAdminRouteName.REWARD_ASSIGNMENTS, component: lazyLoaded.AdminAssignments },
      { path: "admin-patreon-links", name: EAdminRouteName.PATREON_LINKS, component: lazyLoaded.AdminPatreonLinks },
      { path: "admin-drift-detection", name: EAdminRouteName.DRIFT_DETECTION, component: lazyLoaded.AdminDriftDetection },
      { path: "admin-assign-portraits", name: EAdminRouteName.ASSIGN_PORTRAITS, component: lazyLoaded.AdminAssignPortraits },
      { path: "admin-manage-portraits", name: EAdminRouteName.MANAGE_PORTRAITS, component: lazyLoaded.AdminManagePortraits },
      { path: "admin-storage-alibaba", name: EAdminRouteName.MANAGE_ALIBABA_FILES, component: lazyLoaded.AdminStorageAlibaba },
      { path: "admin-storage-s3", name: EAdminRouteName.MANAGE_S3_FILES, component: lazyLoaded.AdminStorageS3 },
      { path: "admin-maps", name: EAdminRouteName.MANAGE_MAPS, component: lazyLoaded.AdminMaps },
      { path: "admin-tournaments", name: EAdminRouteName.MANAGE_TOURNAMENTS, component: lazyLoaded.AdminTournaments },
      { path: "admin-permissions", name: EAdminRouteName.MANAGE_PERMISSIONS, component: lazyLoaded.AdminPermissions },
      { path: "admin-api-tokens", name: EAdminRouteName.MANAGE_API_TOKENS, component: lazyLoaded.AdminApiTokens },
      { path: "admin-server-logs", name: EAdminRouteName.VIEW_SERVER_LOGS, component: lazyLoaded.AdminServerLogs },
      { path: "admin-server-logs/:logFileName", name: EAdminRouteName.SERVER_LOG, component: lazyLoaded.AdminServerLog, props: true },
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
