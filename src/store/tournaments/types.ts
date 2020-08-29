import { ERaceEnum } from '../typings';

export interface ITournamentPlayer {
    name: string;
    race: ERaceEnum;
}

export interface ITournamentMatch {
    players: ITournamentPlayer[]
}