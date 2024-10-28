<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon style="margin-right: 5px">{{ mdiPencil }}</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-list dense max-height="400" class="overflow-y-auto">
        <v-list-item
          v-for="a in actions"
          :key="a.name"
          @click="invoke(a.action)"
        >
          <v-list-item-content>
            <v-list-item-title>{{ a.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import { EClanRole } from "@/store/clan/types";
import { useClanStore } from "@/store/clan/store";
import { mdiPencil } from "@mdi/js";

type MemberManagementMenuAction = {
  name: string;
  action: () => Promise<void>;
};

export default defineComponent({
  name: "MemberManagementMenu",
  components: {},
  props: {
    battleTag: {
      type: String,
      required: true,
    },
    role: {
      type: Number as PropType<EClanRole>,
      required: true,
    },
    loggedInUserRole: {
      type: Number as PropType<EClanRole>,
      required: true,
    },
  },
  setup(props) {
    const clanStore = useClanStore();

    async function kickPlayer(): Promise<void> {
        await clanStore.kickPlayer(props.battleTag);
    }

    async function promoteToShaman(): Promise<void> {
      await clanStore.addShaman(props.battleTag);
    }

    async function demoteShaman(): Promise<void> {
      await clanStore.removeShaman(props.battleTag);
    }

    async function makeChiefTain(): Promise<void> {
      await clanStore.switchChieftain(props.battleTag);
    }

    async function invoke(f: () => Promise<void>): Promise<void> {
      await f();
      await clanStore.retrievePlayersClan();
      await clanStore.retrievePlayersMembership();
    }

    const actions: ComputedRef<Array<MemberManagementMenuAction>> = computed(():  Array<MemberManagementMenuAction> => {
      switch (props.role) {
        case EClanRole.Member:
          switch (props.loggedInUserRole) {
            case EClanRole.Shaman:
              return [
                { name: "Kick Player", action: kickPlayer }
              ];
            case EClanRole.ChiefTain:
              return [
                { name: "Promote To Shaman", action: promoteToShaman },
                { name: "Kick Player", action: kickPlayer }
              ];
            default:
              return [];
          }
        case EClanRole.Shaman:
          switch (props.loggedInUserRole) {
            case EClanRole.Shaman:
              return [];
            case EClanRole.ChiefTain:
              return [
                { name: "Demote To Member", action: demoteShaman },
                { name: "Kick Player", action: kickPlayer },
                { name: "Make Chieftain", action: makeChiefTain }
              ];
            default:
              return [];
          }
        default:
          return [];
      }
    });

    return {
      mdiPencil,
      actions,
      invoke,
    };
  },
});
</script>
