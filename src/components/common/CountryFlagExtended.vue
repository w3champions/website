<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <span v-on="on" @click="clickable && goToCountryRankings()" class="clickable">
        <country-flag
          v-if="selectedCountryCode"
          class="country-flag"
          :country="selectedCountryCode"
          size="small"
        />
      </span>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { CountriesByCode } from "@/store/countries";

// Lazy load.
const CountryFlag = () => import(/* webpackChunkName: "country-flag" */ "vue-country-flag");

@Component({ components: { CountryFlag } })
export default class CountryFlagExtended extends Vue {
  @Prop() countryCode?: string;
  @Prop() location?: string;
  @Prop({ default: true }) clickable!: string;

  get selectedCountryCode(): string {
    if (this.countryCode) {
      return this.countryCode;
    } else if (this.location) {
      return this.location;
    }

    return "";
  }

  get tooltip(): string {
    if (this.countryCode) {
      return CountriesByCode[this.countryCode];
    } else if (this.location) {
      return CountriesByCode[this.location];
    }

    return "";
  }

  goToCountryRankings() {
    this.$router.push(`/Countries?country=${this.selectedCountryCode}`);
  }
}
</script>

<style>
.clickable {
  cursor: pointer;
}
</style>
