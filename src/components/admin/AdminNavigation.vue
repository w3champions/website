<template>
  <v-navigation-drawer permanent>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>
          {{ $t("views_admin.adminpage") }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list dense nav>
      <template v-for="(item, index) in items">
        <v-list-item
          :key="index"
          v-if="!item.items || item.items.length === 0"
          @click="itemSelected(item, index)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon || "mdi-account-tie" }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
          :key="index"
          v-if="item.items && item.items.length > 0"
          :value="false"
          v-bind:prepend-icon="item.icon"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            v-for="(subItem, i) in item.items"
            :key="i"
            @click="itemSelected(subItem, index)"
            link
          >
            <v-list-item-icon>
              <v-icon v-text="subItem.icon || 'mdi-account-tie'"></v-icon>
            </v-list-item-icon>

            <v-list-item-title v-text="subItem.title"></v-list-item-title>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { ItemType } from "@/App.vue";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({ components: {} })
export default class AdminNavigation extends Vue {
  @Prop() items!: ItemType[];

  itemSelected(item: ItemType, index: number) {
    this.$emit("itemSelected", item, index);
  }
}
</script>

<style lang="scss"></style>
