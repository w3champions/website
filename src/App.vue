<template>
  <v-app class="w3app">
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">W3Champions Ladder</div>

      <v-spacer></v-spacer>

      <v-btn v-for="item in items" :key="item.title" text :to="item.to">
        <span class="mr-2 hidden-xs-only">{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>
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
import { Component } from "vue-property-decorator";

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



.won {
  color: green;
}

.lost {
  color: red;
}

.w3app {
}
</style>
