<template>
  <div :style="containerStyle">
    <div v-for="index in (seriesCount / 2)" :key="`top-${index}`">
      <template>
        <tournament-round-connector
          :index="index - 1"
          :side="'top'"
          :playerHeight="playerHeight"
          :verticalSpace="verticalSpace"
        />
        <tournament-round-connector
          :index="index - 1"
          :side="'bottom'"
          :playerHeight="playerHeight"
          :verticalSpace="verticalSpace"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, StyleValue } from "vue";
import TournamentRoundConnector from "./TournamentRoundConnector.vue";

export default defineComponent({
  name: "TournamentRoundConnectors",
  components: {
    TournamentRoundConnector,
  },
  props: {
    seriesCount: { type: Number, required: true },
    connectorWidth: { type: Number, required: true },
    playerHeight: { type: Number, required: true },
    roundNameHeight: { type: Number, required: true },
    verticalSpace: { type: Number, required: true },
    marginTop: { type: Number, required: true },
  },
  setup(props) {
    const containerStyle = computed<StyleValue>(() => {
      return {
        width: `${props.connectorWidth}px`,
        "margin-top": `${props.playerHeight + props.roundNameHeight + props.marginTop}px`,
      };
    });

    return {
      containerStyle,
    };
  },
});
</script>
