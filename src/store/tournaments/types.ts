import { ERaceEnum } from '../typings';

export interface ITournamentPlayer {
    name: string;
    race: ERaceEnum;
}

export interface ITournamentMatch {
    players: ITournamentPlayer[]
}

export interface ITournamentRound {
    round: number;
    matches: ITournamentMatch[]
}

export interface ITournament {
    winnerBracketRounds: ITournamentRound[];
    loserBracketRounds?: ITournamentRound[];
}