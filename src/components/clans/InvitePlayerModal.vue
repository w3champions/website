<template>
  <v-dialog v-model="dialog" max-width="600px">
    <template v-slot:activator="{ props }">
      <v-btn
        variant="outlined"
        color="primary"
        v-bind="props"
        @click="dialog = true"
      >
        <v-icon start>{{ mdiPencil }}</v-icon>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-btn>
    </template>
    <v-card class="pa-4">
      <v-card-title>
        <span>{{ $t("components_clans_inviteplayermodal.inviteplayer") }}</span>
      </v-card-title>
      <v-card-text>
        <player-search
          classes="ml-5 mr-5"
          @searchCleared="searchCleared"
          @playerFound="playerFound"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="text"
          :disabled="!player"
          @click="invitePlayer"
        >
          {{ $t("components_clans_inviteplayermodal.inviteplayer") }}
        </v-btn>
      </v-card-actions>

      <v-alert
        v-model="clanValidationError"
        type="warning"
        density="compact"
        class="ml-4 mr-4"
        closable
      >
        {{ clanValidationErrorText }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useClanStore } from "@/store/clan/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { mdiMagnify, mdiPencil } from "@mdi/js";

export default defineComponent({
  name: "InvitePlayerModal",
  components: {
    PlayerSearch,
  },
  setup() {
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
