import { ERaceEnum } from '../typings';

export enum ConnectionType {
    Default = 1,
    StraightOpen = 2
}

export interface ITournamentPlayer {
    name: string;
    race: ERaceEnum;
}

export interface ITournamentMatch {
    players: ITournamentPlayer[]
}

export interface ITournamentRound {
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