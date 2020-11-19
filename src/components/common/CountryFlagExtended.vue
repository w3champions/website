<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <span v-on="on">
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
import CountryFlag from "vue-country-flag";

@Component({ components: { CountryFlag } })
export default class CountryFlagExtended extends Vue {
  @Prop() countryCode?: string;
  @Prop() location?: string;

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
}
</script>

<style></style>
