<template>
  <v-dialog v-model="isModalOpened" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">
          {{ $t("components_tournaments_TournamentMatchUpdate.updatematch") }}
        </span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row v-if="tournamentMatch">
            <v-col cols="12">
              <p>
                {{ $t("components_tournaments_TournamentMatchUpdate.date") }}
              </p>
              <v-datetime-picker
                ref="datetimePicker"
                label="Select Datetime"
                v-model="date"
              ></v-datetime-picker>
            </v-col>
            <v-col cols="12" md="5" v-if="player1">
              <p>
                {{ $t("components_tournaments_TournamentMatchUpdate.player1") }}
              </p>
              <div v-if="player1">
                <v-text-field
                  color="accent-4"
                  dense
                  clearable
                  single-line
                  shaped
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.name')
                  "
                  v-model="player1.name"
                ></v-text-field>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.id"
                  :items="races"
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.race')
                  "
                  item-text="race"
                  v-model="player1.race"
                  :return-object="false"
                ></v-autocomplete>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.countryCode"
                  :items="countries"
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.country')
                  "
                  item-text="country"
                  v-model="player1.countryCode"
                  :return-object="false"
                >
                  <template v-slot:item="{ item }">
                    {{ item.country }}
                    <v-spacer></v-spacer>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span>{{ item.country }}</span>
                  </template>
                </v-autocomplete>
                <v-text-field
                  color="accent-4"
                  type="number"
                  dense
                  clearable
                  single-line
                  shaped
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.score')
                  "
                  v-model="player1.score"
                ></v-text-field>
              </div>
            </v-col>
            <v-col cols="0" md="1"></v-col>
            <v-col cols="12" md="5">
              <p>
                {{ $t("components_tournaments_TournamentMatchUpdate.player2") }}
              </p>
              <div v-if="player2">
                <v-text-field
                  color="accent-4"
                  dense
                  clearable
                  single-line
                  shaped
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.name')
                  "
                  v-model="player2.name"
                ></v-text-field>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.id"
                  :items="races"
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.race')
                  "
                  item-text="race"
                  v-model="player2.race"
                  :return-object="false"
                ></v-autocomplete>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.countryCode"
                  :items="countries"
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.country')
                  "
                  item-text="country"
                  v-model="player2.countryCode"
                  :return-object="false"
                >
                  <template v-slot:item="{ item }">
                    {{ item.country }}
                    <v-spacer></v-spacer>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span>{{ item.country }}</span>
                  </template>
                </v-autocomplete>
                <v-text-field
                  color="accent-4"
                  type="number"
                  dense
                  clearable
                  single-line
                  shaped
                  :label="
                    $t('components_tournaments_TournamentMatchUpdate.score')
                  "
                  v-model="player2.score"
                ></v-text-field>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="close">
          {{ $t("common.close") }}
        </v-btn>
        <v-btn color="blue darken-1" text @click="saveMatch">
          {{ $t("common.save") }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ECountries } from "@/store/countries";
import CountryFlag from "vue-country-flag";
import { ITournamentMatch, ITournamentPlayer } from "@/store/tournaments/types";
import { ERaceEnum } from "@/store/typings";
import { enumKeys } from "@/helpers/general";

interface DateTimePickerProps extends Element {
  clearHandler: () => void;
}

@Component({ components: { CountryFlag } })
export default class PlayerAvatar extends Vue {
  @Prop() isModalOpened = false;
  @Prop() tournamentMatch?: ITournamentMatch;

  public countries: { country: string; countryCode: string }[] = [];
  public races: { name: string; id: ERaceEnum }[] = [];

  public _date: Date | null = null;
  public _player1Copy?: ITournamentPlayer;
  public _player2Copy?: ITournamentPlayer;

  get date() {
    if (!this._date && this.tournamentMatch && this.tournamentMatch.date) {
      this._date = new Date(this.tournamentMatch.date);
    }
    return this._date;
  }

  set date(d) {
    this._date = d;
  }

  get player1() {
    if (
      !this._player1Copy &&
      this.tournamentMatch &&
      this.tournamentMatch.players
    ) {
      this._player1Copy = JSON.parse(
        JSON.stringify(this.tournamentMatch.players[0])
      );
    }
    return this._player1Copy;
  }

  get player2() {
    if (
      !this._player2Copy &&
      this.tournamentMatch &&
      this.tournamentMatch.players
    ) {
      this._player2Copy = JSON.parse(
        JSON.stringify(this.tournamentMatch.players[1])
      );
    }
    return this._player2Copy;
  }

  saveMatch() {
    if (this.tournamentMatch) {
      this.tournamentMatch.date = this._date?.toISOString();
      if (this._player1Copy && this._player1Copy.score) {
        this._player1Copy.score = parseInt(this._player1Copy.score?.toString());
      }

      if (this._player2Copy && this._player2Copy.score) {
        this._player2Copy.score = parseInt(this._player2Copy.score?.toString());
      }
      this.tournamentMatch.players[0] = this._player1Copy || this.tournamentMatch.players[0];
      this.tournamentMatch.players[1] = this._player2Copy || this.tournamentMatch.players[1];
    }

    this.$emit("saveChanges");
    this.close();
  }

  close() {
    this._date = null;
    (this.$refs.datetimePicker as DateTimePickerProps).clearHandler();
    this._player1Copy = undefined;
    this._player2Copy = undefined;
    this.$emit("modalClosed");
  }

  mounted() {
    enumKeys(ECountries).map((key) => {
      let country = {
        country: key,
        countryCode: ECountries[key] as string,
      };

      this.countries.push(country);
    });

    Object.keys(ERaceEnum).map((key) => {
      const enumValue = Number(key);
      const raceName = this.$t(`races.${ERaceEnum[enumValue]}`).toString();

      if (
        enumValue !== ERaceEnum.RANDOM &&
        enumValue !== ERaceEnum.TOTAL &&
        key !== undefined
      ) {
        let race = {
          name: raceName,
          id: enumValue,
        };

        this.races.push(race);
      }
    });
  }
}
</script>

<style></style>
