<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template #activator="{ on }">
      <v-btn
        @click="dialog = true"
        class="ma-0"
        outlined
        v-on="on"
        color="primary"
      >
        <v-icon left>{{ mdiPencil }}</v-icon>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <v-card-title>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-card-title>
      <v-card-text>
        <player-search
          @searchCleared="searchCleared"
          @playerFound="playerFound"
          classes="ml-5 mr-5"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          :disabled="!player"
          @click="invitePlayer"
        >
          {{ $t("components_clans_inviteplayermodal.inviteplayer") }}
        </v-btn>
      </v-card-actions>

      <v-alert
        v-model="clanValidationError"
        type="warning"
        dense
        class="ml-4 mr-4"
        dismissible
      >
        {{ clanValidationErrorText }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useClanStore } from "@/store/clan/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { mdiMagnify, mdiPencil } from "@mdi/js";

export default defineComponent({
  name: "InvitePlayerModal",
  components: {
    PlayerSearch,
  },
  setup() {
    const playerSearchStore = usePlayerSearchStore();
    const clanStore = useClanStore();
    const dialog = ref<boolean>(false);
    const player = ref<string>("");

    const clanValidationErrorText = computed<string>(() => clanStore.clanValidationError);

    const clanValidationError = computed<boolean>({
      get(): boolean {
        return clanStore.clanValidationError !== "";
      },
      set(): void {
        clanStore.clanValidationError = "";
      },
    });

    async function invitePlayer(): Promise<void> {
      await clanStore.invitePlayer(player.value);
      await clanStore.retrievePlayersClan();
      playerSearchStore.clearPlayerSearch();
    }

    function playerFound(bTag: string): void {
      player.value = bTag;
    }

    function searchCleared(): void {
      player.value = "";
    }

    return {
      mdiMagnify,
      mdiPencil,
      dialog,
      player,
      clanValidationErrorText,
      clanValidationError,
      invitePlayer,
      playerFound,
      searchCleared,
    };
  },
});
</script>
