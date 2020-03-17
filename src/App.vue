<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center"></div>

      <v-spacer></v-spacer>

      <v-btn v-for="item in items" :key="item.title" text :to="item.to">
        <span class="mr-2">{{item.title}}</span>
        <v-icon>{{item.icon}}</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <transition name="fade">
        <router-view />
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
    { title: "Rankings", icon: "mdi-view-list", to: "Rankings" }
  ];
}
</script>

<style lang="scss">
.hide-footer {
  .v-data-footer__select {
    display: none !important;
  }
}

.fade-enter-active, .fade-leave-active {
  transition-property: opacity;
  transition-duration: .25s;
}

.fade-enter-active {
  transition-delay: .25s;
}

.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>