import { moduleActionContext } from "..";
import { PlayerState, PlayerProfile, RaceStat, ModeStat } from "./types";
import { Match } from "../typings";
import { API_URL } from '@/main';
import ApexCharts from 'apexcharts'

const options = {
    chart: {
        type: 'line'
    },
    series: [{
        name: 'sales',
        data: [30,40,35,50,49,60,70,91,125]
    }],
    xaxis: {
        categories: [1991,1992,1993,1994,1995,1996,1997, 1998,1999]
    }
};

const chart = new ApexCharts(document.querySelector("#chart"), options);

chart.render();

const mod = {
    namespaced: true,
    state: {
        battleTag: '',
        page: 0,
        totalMatches: 0,
        playerProfile: {} as PlayerProfile,
        matches: [] as Match[],
        loadingProfile: false,
        loadingRecentMatches: false,
    } as PlayerState,
    actions: {
        async loadProfile(context: any, battleTag: string) {
            const { commit, rootGetters } = moduleActionContext(context, mod);
            const url = `${API_URL}/userstats`;

            commit.SET_LOADING_PROFILE(true);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ account: battleTag })
            });

            const data = await response.json();

            const profile = {} as PlayerProfile;

            profile.account = data.account;
            profile.server = data.server;

            const raceStats: RaceStat[] = [];

            for (const key in data.data.stats) {
                if (Object.prototype.hasOwnProperty.call(data.data.stats, key)) {
                    const element = data.data.stats[key];

                    const percentage = ((element.wins * 100) / (element.wins + element.losses) || 0);

                    raceStats.push({
                        race: key,
                        wins: element.wins,
                        losses: element.losses,
                        total: element.wins + element.losses,
                        percentage: percentage > 0 ? Number(percentage.toFixed(1)) : 0,
                    });
                }
            }

            profile.stats = raceStats;

            const modeStats: ModeStat[] = [];

            for (const key in data.data.ladder) {
                if (Object.prototype.hasOwnProperty.call(data.data.ladder, key)) {
                    const element = data.data.ladder[key];

                    modeStats.push({
                        mode: key,
                        wins: element.wins,
                        losses: element.losses,
                        xp: element.xp,
                        level: element.level,
                        rank: element.rank,
                    });
                }
            }

            profile.ladder = modeStats;

            commit.SET_PROFILE(profile);
            commit.SET_LOADING_PROFILE(false);
        },
        async loadMatches(context: any, page?: number) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);

            if (page != null && !isNaN(page)) {
                commit.SET_PAGE(page - 1);
            }

            commit.SET_LOADING_RECENT_MATCHES(true);
            const response = await rootGetters.matchService.retrievePlayerMatches(state.page, state.battleTag);
            commit.SET_TOTAL_MATCHES(response.total);
            commit.SET_MATCHES(response.items);
            commit.SET_LOADING_RECENT_MATCHES(false);
        },
    },
    mutations: {
        SET_PROFILE(state: PlayerState, profile: PlayerProfile) {
            state.playerProfile = profile;
        },
        SET_PAGE(state: PlayerState, page: number) {
            state.page = page;
        },
        SET_TOTAL_MATCHES(state: PlayerState, totalMatches: number) {
            state.totalMatches = totalMatches;
        },
        SET_MATCHES(state: PlayerState, matches: Match[]) {
            state.matches = matches;
        },
        SET_LOADING_PROFILE(state: PlayerState, loading: boolean) {
            state.loadingProfile = loading;
        },
        SET_LOADING_RECENT_MATCHES(state: PlayerState, loading: boolean) {
            state.loadingRecentMatches = loading;
        },
        SET_BATTLE_TAG(state: PlayerState, battleTag: string) {
            state.battleTag = battleTag;
        },
    }
} as const;

export default mod;
