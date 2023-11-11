<template>
  <v-container v-if="logContent.length === 0" fluid>
    <v-row>
      <v-col>
          <v-row no-gutters :justify="'start'">
            <v-col v-for="logfileName in logfileNames" :key="logfileName" cols="3" class="mb-1 logfileName" @click="fetchLogContent(logfileName)">
              {{ logfileName }}
            </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else fluid>
    <v-row>
      <v-col>
        <v-btn color="primary" class="w3-race-bg--text mr-3" @click="logContent = []">
          Go Back
        </v-btn>
        <v-btn color="primary" class="w3-race-bg--text" @click="downloadLog(selectedLog)">
          Download
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <span class="font-weight-bold">{{ selectedLog }}</span>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <div v-for="(line, index) in logContent" :key="index" class="mb-1">{{ line }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { useServerLogsStore } from "@/store/admin/serverLogs/store";

@Component({ components: {} })
export default class AdminServerLogs extends Vue {
  private serverLogsStore = useServerLogsStore();
  public selectedLog = "";

  get logfileNames(): string[] {
    return this.serverLogsStore.logfileNames;
  }

  get logContent(): string[] {
    return this.serverLogsStore.logContent;
  }

  set logContent(content: string[]) {
    this.serverLogsStore.logContent = content;
  }

  public async fetchLogContent(logfileName: string): Promise<void> {
    this.selectedLog = logfileName;
    window.scrollTo(0,0);
    await this.serverLogsStore.fetchLogContent(logfileName);
  }

  public downloadLog(logfileName: string): void {
    this.serverLogsStore.downloadLog(logfileName);
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  public async init(): Promise<void> {
    await this.serverLogsStore.fetchLogfileNames();
  }

}
</script>

<style lang="scss" scoped>
.logfileName {
  cursor: pointer;
  &:hover {
    background-color: lightblue;
  }
}
</style>
