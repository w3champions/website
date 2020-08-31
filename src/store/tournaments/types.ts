import { ERaceEnum } from '../typings';

export enum ConnectionType {
    Default = 1,
    StraightOpen = 2,
    StraightOpenDown = 3
}

export interface ITournamentPlayer {
    name: string;
    race: ERaceEnum;
    countryCode?: string;
}

export interface ITournamentMatch {
    players: ITournamentPlayer[]
}

export interface ITournamentRound {
    name: string;
    round: number;
    matches: ITournamentMatch[],
    connectionType?: ConnectionType;
    dimensions?: ITournamentRoundDimensions
}

export interface ITournamentRoundDimensions {
    headerHeight: number;
    cellHeight: number;
}

export interface ITournament {
    winnerBracketRounds: ITournamentRound[];
    loserBracketRounds?: ITournamentRound[];
}