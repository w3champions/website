<template>
  <v-card-text>
    <v-row class="justify-center">
      <v-col class="text-center">
        <h3>
          {{ $t("components_clans_acceptinvitepanel.invitemsg1") }}
          <span>{{ clanName }}</span>
          {{ $t("components_clans_acceptinvitepanel.invitemsg2") }}
        </h3>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="3" class="text-center">
        <v-btn variant="outlined" @click="joinClan">
          {{ $t("components_clans_acceptinvitepanel.join") }}
          {{ clanName }}
        </v-btn>
      </v-col>
      <v-col cols="3" class="text-center">
        <v-btn variant="outlined" @click="rejectClan">
          {{ $t("components_clans_acceptinvitepanel.reject") }}
        </v-btn>
      </v-col>
    </v-row>
  </v-card-text>
</template>
<script lang="ts">
import { computed, defineComponent } from "vue";
import { useClanStore } from "@/store/clan/store";

export default defineComponent({
  name: "AcceptInvitePanel",
  components: {},
  setup() {
    const clanStore = useClanStore();
    const clanName = computed<string>(() => clanStore.selectedMemberShip.clanName);

    async function joinClan(): Promise<void> {
      await clanStore.acceptInvite();
      await clanStore.retrievePlayersClan();
      await clanStore.retrievePlayersMembership();
    }

    async function rejectClan(): Promise<void> {
      await clanStore.rejectInvite();
      await clanStore.retrievePlayersClan();
      await clanStore.retrievePlayersMembership();
    }

    return {
      clanName,
      joinClan,
      rejectClan,
    };
  },
});
</script>
