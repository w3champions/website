<template>
  <v-menu location="bottom start">
    <template v-slot:activator="{ props }">
      <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
        {{ buttonText }}
        <img
          v-if="selectedIcon"
          :src="selectedIcon"
          :alt="buttonText"
          class="race-filter-icon ml-2"
        />
        <span v-if="showRandomIcon"> / </span>
        <img
          v-if="showRandomIcon"
          :src="selectedRandomIcon"
          :alt="buttonText + ' Random'"
          class="race-filter-icon"
        />
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="dropdown-menu-content">
        <div class="dropdown-menu-title">{{ label }}</div>
        <v-tooltip
          location="top"
          transition="none"
          content-class="w3-tooltip elevation-1"
          max-width="260"
        >
          <template v-slot:activator="{ props }">
            <div v-bind="props" class="px-3">
              <v-switch
                :model-value="includeRandom"
                hide-details
                density="compact"
                color="primary"
                class="mb-0"
                @click.stop
                @update:model-value="selectIncludeRandom"
              >
                <template v-slot:label>
                  <span>With Random</span>
                </template>
              </v-switch>
            </div>
          </template>

          <div class="tooltip-content">
            <div>
              When enabled, includes matches where Random rolled the selected race.
              Ignored for Any or Random.
            </div>
          </div>
        </v-tooltip>
        <v-divider />
        <v-list density="compact" max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="raceOption in races"
            :key="`${label}-race-${raceOption.raceId}`"
            @click="selectRace(raceOption.raceId)"
          >
            <template v-slot:prepend>
              <img
                v-if="raceOption.icon"
                :src="raceOption.icon"
                :alt="raceOption.raceName"
                class="race-filter-icon mr-3"
              />
            </template>
            <v-list-item-title>{{ raceOption.raceName }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ERaceEnum } from "@/store/types";
import { getAsset } from "@/helpers/url-functions";

type RaceFilterOption = {
  raceName: string;
  raceId: ERaceEnum;
  icon?: string;
};

const { race = ERaceEnum.TOTAL, includeRandom = false, label, prefix = "" } = defineProps<{
  // The selected race. ERaceEnum.TOTAL means "Any", i.e. no filter.
  race?: ERaceEnum;
  // Whether a Random pick that rolled into the selected race should also match.
  includeRandom?: boolean;
  // Heading of the dropdown, and the button text while no race is selected.
  label: string;
  // Prepended to the race name on the button once a race is selected, e.g. "Player Human".
  prefix?: string;
}>();

const emit = defineEmits<{
  raceChanged: [race: ERaceEnum];
  includeRandomChanged: [includeRandom: boolean];
}>();

const { t } = useI18n();

// The file names of the icons for a Random pick that rolled into a given race. They do not follow
// the ERaceEnum spelling the plain race icons use, hence the second map.
const rolledRandomIconNames: Partial<Record<ERaceEnum, string>> = {
  [ERaceEnum.HUMAN]: "Human",
  [ERaceEnum.ORC]: "Orc",
  [ERaceEnum.NIGHT_ELF]: "NightElf",
  [ERaceEnum.UNDEAD]: "Undead",
};

const selectableRaces = [
  ERaceEnum.HUMAN,
  ERaceEnum.ORC,
  ERaceEnum.NIGHT_ELF,
  ERaceEnum.UNDEAD,
  ERaceEnum.RANDOM,
];

const races = computed<RaceFilterOption[]>(() => [
  { raceName: "Any", raceId: ERaceEnum.TOTAL },
  ...selectableRaces.map((raceId) => ({
    raceName: t(`races.${ERaceEnum[raceId]}`),
    raceId,
    icon: getAsset(`raceIcons/${ERaceEnum[raceId]}.png`),
  })),
]);

const selectedRace = computed<RaceFilterOption>(() => {
  return races.value.find((raceOption) => raceOption.raceId === race) ?? races.value[0];
});

const buttonText = computed<string>(() => {
  if (selectedRace.value.raceId === ERaceEnum.TOTAL) return label;
  return prefix ? `${prefix} ${selectedRace.value.raceName}` : selectedRace.value.raceName;
});

const selectedIcon = computed<string | undefined>(() => selectedRace.value.icon);

const selectedRandomIcon = computed<string | undefined>(() => {
  const iconName = rolledRandomIconNames[race];
  return iconName ? getAsset(`raceIcons/${iconName}Random.png`) : undefined;
});

// "With Random" is meaningless for Any (no filter) and for Random itself (already matched), so the
// rolled-random icon only ever appears next to one of the four playable races.
const showRandomIcon = computed<boolean>(() => includeRandom && !!selectedRandomIcon.value);

function selectRace(selected: ERaceEnum): void {
  emit("raceChanged", selected);
}

function selectIncludeRandom(value: boolean | null): void {
  emit("includeRandomChanged", !!value);
}
</script>

<style lang="scss" scoped>
.race-filter-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
