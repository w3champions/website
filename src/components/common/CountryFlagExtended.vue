<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <span :class="{ 'clickable': clickable }" v-bind="props" @click="clickable && goToCountryRankings()">
        <country-flag
          v-if="selectedCountryCode.get()"
          class="country-flag"
          :country="selectedCountryCode.get()"
          :size="size"
        />
      </span>
    </template>
    <span>{{ tooltip() }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from "vue";
import { CountriesByCode } from "@/store/countries";
import { useRouter } from "vue-router";

// Lazy load.
const CountryFlag = defineAsyncComponent(() => import("vue-country-flag-next"));

export default defineComponent({
  name: "CountryFlagExtended",
  components: {
    CountryFlag
  },
  props: {
    countryCode: { type: String, required: false, default: "" },
    location: { type: String, required: false, default: "" },
    clickable: { type: Boolean, required: false, default: true },
    size: { type: String, required: false, default: "small" },
  },
  setup(props) {
    const router = useRouter();

    const selectedCountryCode = ({
      get: (): string => props.countryCode ? props.countryCode : props.location,
    });

    function tooltip(): string {
      if (props.countryCode) return CountriesByCode[props.countryCode];
      if (props.location) return CountriesByCode[props.location];
      return "";
    }

    function goToCountryRankings() {
      router.push(`/Countries?country=${selectedCountryCode.get()}`);
    }

    return {
      selectedCountryCode,
      tooltip,
      goToCountryRankings,
    };
  },
});
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}

.country-flag {
  font-size: 0.875rem;
  vertical-align: middle;
}
</style>
