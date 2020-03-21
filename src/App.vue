<template>
  <v-app class="w3app variant" :dark="enableDarkMode">
    <v-app-bar :class="{darkmode: enableDarkMode}" app>
      <div class="d-flex align-center">W3Champions Ladder</div>

      <v-spacer></v-spacer>

      <v-btn
        class="button-margin"
        v-for="item in items"
        :key="item.title"
        text
        tile
        :to="item.to"
      >
        <span class="mr-2 hidden-xs-only">{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>
      <v-switch
        color="grey"
        :dark="enableDarkMode"
        style="padding-top: 20px;"
        v-model="enableDarkMode"
        label="Dark Mode"
      ></v-switch>
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
    this.$store.direct.commit.SET_DARK_MODE(val);
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

.button-margin {
  margin-right: 10px;
}

.v-btn:before {
  background-color: transparent !important;
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

.won {
  color: green;
  font-weight: 500;
}

.lost {
  color: red;
  font-weight: 500;
}

@font-face {
  font-family: "Friz Quadrata Regular OS";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Regular OS"),
    url("./assets/friz-quadrata-regular-os-5870333951e7c.woff") format("woff");

  * {
    font-family: "Friz Quadrata Regular OS" !important;
  }
}

.v-application {
  font-family: "Friz Quadrata Regular OS" !important;
}

.v-app-bar {
  background-color: transparent !important;
  font-family: "Friz Quadrata Regular OS";
}

.theme--light.v-application {
  @font-face {
    * {
      font-family: "Friz Quadrata Regular OS";
      color: #000;
    }
  }

  background: url(./assets/human/background.jpg) no-repeat !important;
  background-attachment: fixed !important;
  background-size: cover !important;
  align-items: center !important;
  justify-content: center !important;

  .v-app-bar:before {
    content: "" !important;
    background: inherit !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    box-shadow: inset 0 0 0 3000px rgba(200, 200, 200, 0.6) !important;
  }

  .v-card {
    background: inherit !important;
    overflow: hidden !important;
    color: #000000 !important;
  }

  .v-card__text {
    color: #000000 !important;
    filter: blur(0) !important;
  }

  .v-expansion-panel {
    background-color: transparent !important;
  }

  .v-card:before {
    content: "" !important;
    background: inherit !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    box-shadow: inset 0 0 0 3000px rgba(255, 255, 255, 0.6) !important;
  }

  .v-list {
    background-color: transparent !important;
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
  }

  .v-tabs-bar {
    background-color: transparent !important;
    a {
      color: #000000 !important;
      filter: blur(0) !important;
    }
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
  }

  .v-tabs-slider-wrapper {
    color: #000000 !important;
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
  }

  .v-tabs-items {
    background-color: transparent !important;
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
  }

  .v-tab {
    background-color: transparent !important;
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);
  }

  .v-data-table {
    background-color: transparent !important;
    filter: blur(0);
    -webkit-backface-visibility: hidden;
    -webkit-perspective: 1000;
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000;
    transform: translate3d(0, 0, 0);
    transform: translateZ(0);

    tr:hover {
      background-color: transparent !important;
      box-shadow: 0 0 6px black;
      position: relative;
      z-index: 1;
    }
  }
}

.theme--light.v-application.variant {
  background: url(./assets/orc/background.jpg) no-repeat !important;
  background-attachment: fixed !important;
  background-size: cover !important;
  align-items: center !important;
  justify-content: center !important;
}

.theme--dark.v-application {
  @font-face {
    * {
      font-family: "Friz Quadrata Regular OS";
      color: #fff;
    }
  }

  background: url(./assets/undead/background.jpg) no-repeat !important;
  background-attachment: fixed !important;
  background-size: cover !important;
  align-items: center !important;
  justify-content: center !important;

  .v-btn {
    font-family: "Friz Quadrata Regular OS" !important;
    color: rgb(255, 212, 40) !important;
    letter-spacing: 1.56px !important;
    text-transform: uppercase !important;
    text-shadow: rgb(0, 0, 0) 0px 3px 1px !important;
  }

  .v-app-bar:before {
    content: "" !important;
    background: inherit !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    box-shadow: inset 0 0 0 3000px rgba(0, 0, 0, 0.8) !important;
  }

  .v-app-bar.v-toolbar.v-sheet.darkmode {
    background-color: transparent !important;
  }

  .v-card {
    background: inherit !important;
    overflow: hidden !important;
    color: #ffffff !important;
  }

  .v-card__title {
    font-family: "Friz Quadrata Regular OS" !important;
    color: rgb(255, 212, 40) !important;
    letter-spacing: 1.56px !important;
    text-transform: uppercase !important;
    text-shadow: rgb(0, 0, 0) 0px 3px 1px !important;
  }

  h3 {
    font-family: "Friz Quadrata Regular OS" !important;
    color: rgb(255, 212, 40) !important;
    letter-spacing: 1.56px !important;
    text-transform: uppercase !important;
    text-shadow: rgb(0, 0, 0) 0px 3px 1px !important;
    font-weight: 400 !important;
  }

  .v-card__text {
    color: #ffffff !important;
    filter: blur(0) !important;
  }

  .v-expansion-panel {
    background-color: transparent !important;
  }

  .v-card:before {
    content: "" !important;
    background: inherit !important;
    position: absolute !important;
    left: 0 !important;
    right: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    box-shadow: inset 0 0 0 3000px rgba(0, 0, 0, 0.8) !important;
  }

  .v-list {
    background-color: transparent !important;
  }

  .v-tabs-bar {
    background-color: transparent !important;
    a {
      color: #ffffff !important;
      filter: blur(0) !important;
    }
  }

  .v-tabs-slider-wrapper {
    color: #ffffff !important;
  }

  .v-tabs-items {
    background-color: transparent !important;
  }

  .v-tab {
    background-color: transparent !important;
  }

  .v-data-table {
    background-color: transparent !important;
    filter: blur(0);

    tr:hover {
      background-color: transparent !important;
      box-shadow: 0 0 17px grey;
      position: relative;
      z-index: 1;
    }
  }
}

.theme--dark.v-application.variant {
  background: url(./assets/nightelf/background.jpg) no-repeat !important;
  background-attachment: fixed !important;
  background-size: cover !important;
  align-items: center !important;
  justify-content: center !important;
}

.v-card__title {
  filter: blur(0) !important;
}

.v-app-bar.v-toolbar.v-sheet.darkmode {
  background-color: #292b2f !important;
}

.row {
  filter: blur(0px);
}
</style>
