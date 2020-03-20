import { Match } from '../typings';

export type MatchState = {
    matches: Match[];
    page: number;
    totalMatches: number;
}