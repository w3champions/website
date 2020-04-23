<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Profile of
            <span v-if="!loadingProfile" class="playerTag">
              {{ profile.name }}#{{ profile.battleTag }}</span
            >
          </v-card-title>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-profile`">Profile</v-tab>
            <v-tab class="profileTab" :href="`#tab-matches`">Match History</v-tab>
            <v-tab class="profileTab" :href="`#tab-statistics`">Statistics</v-tab>
            <v-tab-item :value="'tab-profile'">
              <v-card-text v-if="!loadingProfile">
                <v-row>
                  <v-col cols="2">
                    <v-card-text style="padding-top: 0 !important;">
                      <player-avatar
                        :personal-setting="this.personalSettings"
                        :wins="this.playerWins"
                        :is-logged-in-player="isLoggedInPlayer"
                      />
                      <h3>Homepage:
                        <template>
                          <v-icon
                            v-if="isLoggedInPlayer"
                            class="float-lg-right"
                            @click="homepageEdit.opened = !homepageEdit.opened"
                            >mdi-pencil</v-icon
                          >
                        </template>
                        <v-dialog
                          v-model="homepageEdit.opened"
                          max-width="500px"
                        >
                          <v-card>
                            <v-card-text>
                              <v-form v-model="homepageEdit.savable">
                                <v-text-field
                                  counter="50"
                                  :rules="[rules.maxLength(50)]"
                                  label="Homepage"
                                  placeholder="Homepage"
                                  v-model="homepageEdit.text"
                                ></v-text-field>
                              </v-form>
                            </v-card-text>
                            <v-card-actions>
                              <v-spacer></v-spacer>
                              <v-btn :disabled="!homepageEdit.savable" text color="primary" @click="saveHomepageInfo">Save</v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                      </h3>
                      <div>{{ homePage ? homePage : "-" }}</div>
                      <h3>About:
                        <template>
                          <v-icon
                            v-if="isLoggedInPlayer"
                            class="float-lg-right"
                            @click="
                              additonalInfoEdit.opened = !additonalInfoEdit.opened
                            "
                            >mdi-pencil</v-icon
                          >
                        </template>
                        <v-dialog
                          v-model="additonalInfoEdit.opened"
                          max-width="500px"
                        >
                          <v-card>
                            <v-card-text>
                              <v-form v-model="additonalInfoEdit.savable">
                                <v-textarea
                                  counter="300"
                                  :rules="[rules.maxLength(300)]"
                                  label="Additional Info"
                                  placeholder="Additional Info"
                                  v-model="additonalInfoEdit.text"
                                ></v-textarea>
                              </v-form>
                            </v-card-text>
                            <v-card-actions>
                              <v-spacer></v-spacer>
                              <v-btn :disabled="!additonalInfoEdit.savable" text color="primary" @click="saveAdditionalInfo">Save</v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-dialog>
                      </h3>
                      <div>
                        {{ savedMessageValue ? savedMessageValue : "-" }}
                      </div>
                    </v-card-text>
                  </v-col>
                  <v-col cols="6">
                    <h4>Statistics by Game Mode</h4>
                    <mode-stats-grid :stats="oneVersusOneGameModeStats"></mode-stats-grid>
                  </v-col>
                  <v-col cols="4">
                    <h4>Statistics by Race</h4>
                    <v-data-table hide-default-footer :headers="raceHeaders" :items="profile.raceStats">
                      <template v-slot:item.race="{ item }">
                        <span>{{ $t("races." + raceEnums[item.race]) }}</span>
                      </template>
                      <template v-slot:item.wins="{ item }">
                        <span class="won">{{ item.wins }}</span>
                      </template>
                      <template v-slot:item.losses="{ item }">
                        <span class="lost">{{ item.losses }}</span>
                      </template>
                      <template v-slot:item.percentage="{ item }">{{ (item.winrate *100).toFixed(1) }}%</template>
                    </v-data-table>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text v-if="loadingProfile" style="min-height: 500px" class="text-center">
                <v-progress-circular
                  style="margin-top: 180px;"
                  :size="50"
                  color="primary"
                  indeterminate
                ></v-progress-circular>
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-matches'">
              <v-card-title>Match History</v-card-title>
              <matches-grid
                v-model="matches"
                :totalMatches="totalMatches"
                @pageChanged="onPageChanged"
                :itemsPerPage="15"
                :alwaysLeftName="battleTag"
                :only-show-enemy="true"
              ></matches-grid>
            </v-tab-item>
            <v-tab-item :value="'tab-statistics'">
              <v-card-title>Statistics</v-card-title>
              <player-stats-race-versus-race-on-map
                :stats="raceWithoutRandom"
              />
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import {Component, Prop, Watch} from "vue-property-decorator";
import {ModeStat, PlayerProfile, PlayerStatsRaceOnMapVersusRace, RaceWinsOnMap} from "@/store/player/types";
import {EGameMode, ERaceEnum, Match} from "@/store/typings";
import MatchesGrid from "../components/MatchesGrid.vue";
import ModeStatsGrid from "@/components/ModeStatsGrid.vue";
import PlayerStatsRaceVersusRaceOnMap from "@/components/PlayerStatsRaceVersusRaceOnMap.vue";
import {PersonalSetting} from "@/store/personalSettings/types";
import PlayerAvatar from "@/components/PlayerAvatar.vue";

@Component({
  components: {
    PlayerAvatar,
    PlayerStatsRaceVersusRaceOnMap,
    MatchesGrid,
    ModeStatsGrid
  }
})
export default class PlayerView extends Vue {
  @Prop() public id!: string;

  public raceEnums = ERaceEnum;
  public homepageEdit = { opened: false, text: this.personalSettings.homePage, savable: true };
  public additonalInfoEdit = { opened: false, text: this.personalSettings.profileMessage, form: true };

  public rules = {
    maxLength: (len: number) => (v: string) => (v || '').length < len || `Can not exceed ${len} characters`,
  };

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race"
    },
    {
      text: "Wins",
      align: "start",
      sortable: false,
      value: "wins"
    },
    {
      text: "Losses",
      align: "start",
      sortable: false,
      value: "losses"
    },
    {
      text: "Winrate",
      align: "start",
      sortable: false,
      value: "percentage"
    }
  ];

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (!this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap) return [];
    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMap.filter(
      r => r.race !== ERaceEnum.RANDOM
    );
  }

  get playerWins() {
    return this.$store.direct.state.player?.playerProfile?.raceStats ?? [];
  }

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get personalSettings(): PersonalSetting {
    return this.$store.direct.state.personalSettings.personalSettings;
  }

  get verifiedBtag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get playerStatsRaceVersusRaceOnMap(): PlayerStatsRaceOnMapVersusRace {
    return this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap;
  }

  get oneVersusOneGameModeStats(): ModeStat[] {
    if (this.profile && this.profile.gameModeStats) {
      return this.profile.gameModeStats.filter(g => g.mode === EGameMode.GM_1ON1);
    }

    return [];
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get battleTag(): string {
    return this.id;
  }

  get savedMessageValue(): string {
    return this.personalSettings.profileMessage;
  }

  get homePage(): string {
    return this.personalSettings.homePage;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  async saveAdditionalInfo() {
    await this.$store.direct.dispatch.personalSettings.saveAditionalInfo(this.additonalInfoEdit.text);
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting();
    this.additonalInfoEdit.opened = false;
  }

  async saveHomepageInfo() {
    await this.$store.direct.dispatch.personalSettings.saveHomepageInfo(this.homepageEdit.text);
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting();
    this.homepageEdit.opened = false;
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get isLoggedInPlayer(): boolean {
    return this.battleTag.startsWith(this.verifiedBtag);
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
  }

  public getMatches(page?: number) {
    this.$store.direct.dispatch.player.loadMatches(page);
  }

  mounted() {
    this.init();
  }

  private async init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.getMatches();

    await this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    await this.$store.direct.dispatch.player.loadPlayerStatsRaceVersusRaceOnMap(this.battleTag);
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting();
  }
}
</script>

<style lang="scss" scoped>
.profileTab {
  background-color: #f5f5f5;
}

.theme--dark {
  .profileTab {
    background-color: #2f2f2f;
  }
}

.playerTag {
  margin-left: 10px;
  text-transform: none;
}
</style>
