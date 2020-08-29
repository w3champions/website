<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <span v-on="on">
        <country-flag
          v-if="countryCode"
          class="country-flag"
          :country="countryCode"
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
import { ECountries, CountriesByCode } from "@/store/countries";
import CountryFlag from "vue-country-flag";

@Component({ components: { CountryFlag } })
export default class CountryFlagExtended extends Vue {
  @Prop() country?: string;
  @Prop() location?: string;

  get countryCode(): string {
    if (this.country) {
      return (ECountries as any)[this.country];
    } else if (this.location) {
      return this.location;
    }

    return "";
  }

  get tooltip(): string {
    if (this.country) {
      return this.country;
    } else if (this.location) {
      return CountriesByCode[this.location];
    }

    return "";
  }
}
</script>

<style></style>
