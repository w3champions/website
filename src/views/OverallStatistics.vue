<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>Statistics of W3Champions</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab class="profileTab" :href="`#tab-1`">Games Per Day</v-tab>
            <v-tab-item :value="'tab-1'">
              <v-card-title>Games Per Day</v-card-title>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({
  components: {
  }
})
export default class OverallStatisticsView extends Vue {

}
</script>
