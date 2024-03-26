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
      <template v-for="(item, index) in items" :key="index">
        <v-list-item
          v-if="!item.items || item.items.length === 0"
          @click="itemSelected(item, index)"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon || mdiAccountTie }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
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
            class="ml-0 pl-6"
            v-for="(subItem, i) in item.items"
            :key="i"
            @click="itemSelected(subItem, index)"
            link
          >
            <v-list-item-icon>
              <v-icon>{{ subItem.icon || mdiAccountTie }}</v-icon>
            </v-list-item-icon>

            <v-list-item-title>{{ subItem.title }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { NavigationItem } from "@/store/admin/types";
import { mdiAccountTie } from "@mdi/js";
import { Component, Prop, Vue } from "vue-facing-decorator";

@Component({ components: {} })
export default class AdminNavigation extends Vue {
  @Prop() items!: NavigationItem[];
  public mdiAccountTie = mdiAccountTie;

  itemSelected(item: NavigationItem, index: number) {
    this.$emit("itemSelected", item, index);
  }
}
</script>

<style lang="scss"></style>
