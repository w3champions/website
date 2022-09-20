import { moduleActionContext } from "..";
import { ActionContext } from "vuex";
import { TournamentsState, ITournament, ITournamentPlayer, ITournamentSeries, IMatchPlayer, ISeriesPlayer } from "./types";
import { RootState } from "../typings";
import { ETournamentFormat, ETournamentState, ETournamentType, ITournamentRound, ITournamentAdmin, ITournamentMatch } from "./types";
import { EGameMode, ERaceEnum } from "../typings";
import { Gateways } from "../ranking/types";

const mod = {
  namespaced: true,
  state: {
    tournaments: [
      {
        id: '1',
        name: 'Standard One vs One Tournament',
        startDateTime: new Date(),
        state: ETournamentState.FINISHED,
        mode: EGameMode.GM_1ON1,
        format: ETournamentFormat.SINGLE_ELIM,
        type: ETournamentType.AUTOMATED,
        gateway: Gateways.Europe,
        matcherinoLink: 'https://matcherino.com/tournaments/53689',
        mapPool: [ 1, 2, 3 ],
        winner: {
          battleTag: 'Happy#1233',
          race: ERaceEnum.UNDEAD,
          countryCode: 'RU',
        } as ITournamentPlayer,
        players: [
          {
            battleTag: 'Happy#1233',
            race: ERaceEnum.UNDEAD,
            countryCode: 'RU',
          } as ITournamentPlayer,
          {
            battleTag: 'Grubby#1728',
            race: ERaceEnum.ORC,
            countryCode: 'NED',
          } as ITournamentPlayer,
        ],
        rounds: [
          {
            name: 'Round 1',
            number: 1,
            series: [
              {
                id: '1',
                players: [
                  {
                    battleTag: 'Happy#1233',
                    score: 1,
                    team: 0,
                    won: false,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby#1728',
                    score: 0,
                    team: 1,
                    won: true,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
              {
                id: '2',
                players: [
                  {
                    battleTag: 'Happy2#1233',
                    score: 1,
                    team: 0,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby2#1728',
                    score: 0,
                    team: 1,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy2#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby2#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
              {
                id: '3',
                players: [
                  {
                    battleTag: 'Happy3#1233',
                    score: 1,
                    team: 0,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby3#1728',
                    score: 0,
                    team: 1,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy3#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby3#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
              {
                id: '4',
                players: [
                  {
                    battleTag: 'Happy4#1233',
                    score: 1,
                    team: 0,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby4#1728',
                    score: 0,
                    team: 1,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy4#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby4#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
            ],
          } as ITournamentRound,
          {
            name: 'Round 2',
            number: 1,
            series: [
              {
                id: '1',
                players: [
                  {
                    battleTag: 'Happy#1233',
                    team: 0,
                    score: 1,
                    won: true,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby#1728',
                    score: 0,
                    team: 1,
                    won: false,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
              {
                id: '2',
                players: [
                  {
                    battleTag: 'Happy#1233',
                    score: 1,
                    team: 0,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby#1728',
                    score: 0,
                    team: 1,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
            ],
          } as ITournamentRound,
          {
            name: 'Round 3',
            number: 2,
            series: [
              {
                id: '3',
                players: [
                  {
                    battleTag: 'Happy#1233',
                    score: 1,
                    team: 0,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby#1728',
                    score: 0,
                    team: 1,
                  } as ISeriesPlayer,
                ],
                matches: [
                  {
                    players: [
                      {
                        battleTag: 'Happy#1233',
                        won: true,
                      } as IMatchPlayer,
                      {
                        battleTag: 'Grubby#1728',
                        won: false,
                      } as IMatchPlayer,
                    ],
                  } as ITournamentMatch,
                ],
              } as ITournamentSeries,
            ],
          } as ITournamentRound,
        ],
        admins: [
          {
            battleTag: 'admin#1234',
            countryCode: 'RO',
          } as ITournamentAdmin,
        ],
      }
    ],
  } as TournamentsState,
  actions: {
    async retrieveTournaments(
      context: ActionContext<TournamentsState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.tournamentsService.getTournaments();

      commit.SET_TOURNAMENTS(response.tournaments);
    },

    // TODO: check
    // async saveTournament(
    //   context: ActionContext<ITournament, RootState>,
    //   tournament?: ITournament
    // ) {
    //   if (!tournament) return;

    //   const { dispatch, rootGetters, rootState } = moduleActionContext(
    //     context,
    //     mod
    //   );

    //   await rootGetters.tournamentsService.updateTournament(
    //     tournament,
    //     rootState.oauth.token
    //   );

    //   await dispatch.retrieveTournaments();

    //   return tournament;
    // },
  },
  mutations: {
    SET_TOURNAMENTS(state: TournamentsState, tournaments: ITournament[]) {
      state.tournaments = tournaments;
    },
  },
} as const;

export default mod;
