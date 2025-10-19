<template>
  <v-col cols="6">
    <h3 class="text-subtitle-2">{{ title }}</h3>
    <v-table dense>
      <thead>
        <tr>
          <th>BattleTag</th>
          <th class="text-right"># Logins</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in data" :key="stat.battleTag">
          <td>
            {{ stat.battleTag }}
            <moderation-status-badges :battle-tag="stat.battleTag" :compact="true" class="ml-1" />
          </td>
          <td class="text-right">{{ stat.numberOfLogins }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { BattleTagLoginCount } from "@/services/admin/smurf-detection/SmurfDetectionResponse";
import ModerationStatusBadges from "./ModerationStatusBadges.vue";

export default defineComponent({
  name: "SmurfBattleTagDetailsTable",
  components: {
    ModerationStatusBadges,
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    data: {
      type: Array as PropType<BattleTagLoginCount[]>,
      required: true,
    },
  },
});
</script>
