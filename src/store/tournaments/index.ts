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
          countryCode: '123',
        } as ITournamentPlayer,
        players: [
          {
            battleTag: 'Happy#1233',
            race: ERaceEnum.UNDEAD,
            countryCode: '123',
          } as ITournamentPlayer,
          {
            battleTag: 'Grubby#1728',
            race: ERaceEnum.ORC,
            countryCode: '321',
          } as ITournamentPlayer,
        ],
        rounds: [
          {
            name: 'Round 1',
            round: 1,
            series: [
              {
                players: [
                  {
                    battleTag: 'Happy#1233',
                    score: 1,
                  } as ISeriesPlayer,
                  {
                    battleTag: 'Grubby#1728',
                    score: 0,
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
            countryCode: '321',
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
