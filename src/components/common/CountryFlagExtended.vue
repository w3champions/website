<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <span :class="{ 'cursor-pointer': clickable }" v-bind="props" @click="clickable && goToCountryRankings()">
        <country-flag
          v-if="selectedCountryCode"
          class="country-flag"
          :country="selectedCountryCode"
          :size="size"
        />
      </span>
    </template>
    <span>{{ tooltip() }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { CountriesByCode } from "@/store/countries";
import { useRouter } from "vue-router";

// Lazy load.
const CountryFlag = defineAsyncComponent(() => import("vue-country-flag-next"));

const { countryCode = "", location = "", clickable = true, size = "small" } = defineProps<{
  countryCode?: string;
  location?: string;
  clickable?: boolean;
  size?: string;
}>();

const router = useRouter();
const selectedCountryCode = ref<string>(countryCode ? countryCode : location);

function tooltip(): string {
  if (countryCode) return CountriesByCode[countryCode];
  if (location) return CountriesByCode[location];
  return "";
}

function goToCountryRankings(): void {
  router.push(`/Countries?country=${selectedCountryCode.value}`);
}
</script>

<style lang="scss" scoped>
.country-flag {
  font-size: 0.875rem;
  vertical-align: middle;
}
</style>
