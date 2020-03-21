<template>
  <v-app class="w3app" :dark="enableDarkMode">
    <v-app-bar :class="{darkmode: enableDarkMode}" app :color="enableDarkMode ? '' : 'primary'" dark>
      <div class="d-flex align-center">W3Champions Ladder</div>

      <v-spacer></v-spacer>

      <v-btn v-for="item in items" :key="item.title" text :to="item.to">
        <span class="mr-2 hidden-xs-only">{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>
      <v-switch style="padding-top: 20px;" v-model="enableDarkMode" label="Dark Mode"></v-switch>
    </v-app-bar>

    <v-content>
      <transition name="fade">
        <router-view :key="$route.fullPath" />
      </transition>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";

@Component({})
export default class App extends Vue {
  public drawer = true;
  public mini = true;
  public items = [
    { title: "Home", icon: "mdi-home-city", to: "/" },
    { title: "Rankings", icon: "mdi-view-list", to: "/Rankings" },
    { title: "Matches", icon: "mdi-controller-classic", to: "/Matches" },
    { title: "FAQ", icon: "mdi-help-circle-outline", to: "/Faq" }
  ];

  get enableDarkMode(): boolean {
    return this.$vuetify.theme.dark;
  }

  set enableDarkMode(val: boolean) {
    window.localStorage.setItem("dark", val ? "1" : "0");
    this.$vuetify.theme.dark = val;
  }

  created() {
    this.enableDarkMode = window.localStorage.getItem("dark") === "1";
  }
}
</script>

<style lang="scss">
.hide-footer {
  .v-data-footer__select {
    display: none !important;
  }
}

.table-row-pointer {
  tbody {
    tr {
      cursor: pointer !important;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
  transition-duration: 0.25s;
}

.fade-enter-active {
  transition-delay: 0.25s;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}

.level {
  color: white;
  text-shadow: 0.5px 0.5px 0.5px black, 0.5px -0.5px 0.5px black,
    -0.5px 0.5px 0.5px black, -0.5px -0.5px 0.5px black;
}

.profile {
  .v-tabs {
    .v-tabs-bar__content {
      border-bottom: 1px solid #cdcdcd !important;
    }
  }
}

@media (min-width: 960px) {
  .container {
    max-width: none !important;
  }
}

@media (min-width: 1264px) {
  .container {
    max-width: 1185px !important;
  }
}

@media (min-width: 1904px) {
  .container {
    max-width: 1785px !important;
  }
}

.theme--dark.v-application {
  background: #2f3136 !important;
  color: #ffffff;
}

.theme--dark.v-card {
  background-color: #36393f !important;
  color: #ffffff;
}

.theme--dark.v-data-table {
  background-color: #36393f !important;
  color: #ffffff;
}

.theme--dark.v-list {
  background: #36393f !important;
  color: #ffffff;
}

.theme--dark.v-tabs > .v-tabs-bar {
  background-color: #36393f !important;
}

.theme--dark.v-tabs-items {
    background-color: #36393f !important;
}

.theme--dark.v-expansion-panels .v-expansion-panel {
    background-color: #36393f !important;
    color: #FFFFFF;
}

.theme--dark.v-app-bar.v-toolbar.v-sheet.darkmode {
    background-color: #292b2f !important;
}

.w3app {
}
</style>
