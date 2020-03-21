import {GameMode, ModeStat, PlayerProfile, Race, RaceStat} from '@/store/player/types';
import {API_URL} from '@/main';

export default class ProfileService {

    public async retrieveProfile(battleTag: string): Promise<PlayerProfile> {
        const url = `${API_URL}/userstats`;

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

        const races: { [id: string]: Race; } = {
            "human": Race.human,
            "orc": Race.orc,
            "undead": Race.undead,
            "night_elf": Race.nightElf,
            "random": Race.random,
            "total": Race.total,
        };

        for (const key in data.data.stats) {
            if (Object.prototype.hasOwnProperty.call(data.data.stats, key)) {
                const element = data.data.stats[key];

                const percentage = ((element.wins * 100) / (element.wins + element.losses) || 0);

                raceStats.push({
                    race: races[key],
                    wins: element.wins,
                    losses: element.losses,
                    total: element.wins + element.losses,
                    percentage: percentage > 0 ? Number(percentage.toFixed(1)) : 0,
                });
            }
        }

        profile.stats = raceStats;

        const modeStats: ModeStat[] = [];
        const gameModes: { [id: string]: GameMode; } = {
            "solo": GameMode._1v1,
            "two": GameMode._2v2,
            "three": GameMode._3v3,
            "four": GameMode._4v4,
            "ffa": GameMode.ffa,
        };

        for (const key in data.data.ladder) {
            if (Object.prototype.hasOwnProperty.call(data.data.ladder, key)) {
                const element = data.data.ladder[key];

                modeStats.push({
                    mode: gameModes[key],
                    wins: element.wins,
                    losses: element.losses,
                    xp: element.xp,
                    level: element.level,
                    rank: element.rank,
                    bucket: element.bucket
                });
            }
        }

        profile.ladder = modeStats;

        return profile;
    }

    public async retrieveRawProfile(battleTag: string) {
        const url = `${API_URL}/userstats`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account: battleTag })
        });

        return await response.json();
    }
}
