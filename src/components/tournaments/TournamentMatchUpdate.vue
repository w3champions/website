<template>
  <v-dialog v-model="isModalOpened" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">Update match</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row v-if="tournamentMatch">
            <v-col cols="12" md="5" v-if="player1">
              <p>Player 1</p>
              <div v-if="player1">
                <v-text-field
                  color="accent-4"
                  dense
                  clearable
                  single-line
                  shaped
                  label="Name"
                  v-model="player1.name"
                ></v-text-field>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.id"
                  :items="races"
                  label="Race"
                  item-text="name"
                  v-model="player1.race"
                  :return-object="false"
                ></v-autocomplete>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.countryCode"
                  :items="countries"
                  label="Country"
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
                  label="Score"
                  v-model="player1.score"
                ></v-text-field>
              </div>
            </v-col>
            <v-col cols="0" md="1"></v-col>
            <v-col cols="12" md="5">
              <p>Player 2</p>
              <div v-if="player2">
                <v-text-field
                  color="accent-4"
                  dense
                  clearable
                  single-line
                  shaped
                  label="Name"
                  v-model="player2.name"
                ></v-text-field>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.id"
                  :items="races"
                  label="Race"
                  item-text="name"
                  v-model="player2.race"
                  :return-object="false"
                ></v-autocomplete>
                <v-autocomplete
                  clearable
                  :item-value="(obj) => obj.countryCode"
                  :items="countries"
                  label="Country"
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
                  label="Score"
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
          Close
        </v-btn>
        <v-btn color="blue darken-1" text @click="saveMatch">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { ECountries } from "@/store/countries";
import CountryFlag from "vue-country-flag";
import { ITournamentMatch, ITournamentPlayer } from "@/store/tournaments/types";
import { ERaceEnum } from "@/store/typings";

@Component({ components: { CountryFlag } })
export default class PlayerAvatar extends Vue {
  @Prop() isModalOpened = false;
  @Prop() tournamentMatch?: ITournamentMatch;

  public countries: { country: string; countryCode: string }[] = [];
  public races: { name: string; id: ERaceEnum }[] = [];

  public _player1Copy?: ITournamentPlayer;
  public _player2Copy?: ITournamentPlayer;

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
      if (this._player1Copy && this._player1Copy.score) {
        this._player1Copy.score = parseInt(this._player1Copy.score?.toString());
      }

      if (this._player2Copy && this._player2Copy.score) {
        this._player2Copy.score = parseInt(this._player2Copy.score?.toString());
      }
      this.tournamentMatch.players[0] = this._player1Copy as any;
      this.tournamentMatch.players[1] = this._player2Copy as any;
    }

    this.$emit("saveChanges");
    this.close();
  }

  close() {
    this._player1Copy = undefined;
    this._player2Copy = undefined;
    this.$emit("modalClosed");
  }

  mounted() {
    Object.keys(ECountries).map((key) => {
      let country = {
        country: key,
        countryCode: (ECountries as any)[key] as string,
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
