<template>
    <v-col cols="6">
      <h3 class="text-subtitle-2">{{ title }}</h3>
      <v-simple-table dense>
        <thead>
          <tr>
            <th>BattleTag</th>
            <th class="text-right"># Logins</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in data" :key="stat.battleTag">
            <td>{{ stat.battleTag }}</td>
            <td class="text-right">{{ stat.numberOfLogins }}</td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-col>
  </template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { BattleTagLoginCount } from "@/services/admin/smurf-detection/SmurfDetectionResponse";

export default defineComponent({
  name: "SmurfBattleTagDetailsTable",
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
