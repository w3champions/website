<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <span v-on="on" @click="clickable && goToCountryRankings()" :class="{ 'clickable': clickable }">
        <country-flag
          v-if="selectedCountryCode.get()"
          class="country-flag"
          :country="selectedCountryCode.get()"
          size="small"
        />
      </span>
    </template>
    <span>{{ tooltip() }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { CountriesByCode } from "@/store/countries";
import { useRouter } from "vue-router";

// Lazy load.
const CountryFlag = () => import(/* webpackChunkName: "country-flag" */ "vue-country-flag");

export default defineComponent({
  name: "CountryFlagExtended",
  components: {
    CountryFlag
  },
  props: {
    countryCode: { type: String, required: false, default: "" },
    location: { type: String, required: false, default: "" },
    clickable: { type: Boolean, required: false, default: true },
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
</style>
