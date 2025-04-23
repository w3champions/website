<template>
  <div>
    <v-card-title>
      {{ $t("components_clans_pendinginvitespanel.invitespending") }}
    </v-card-title>
    <v-card-subtitle v-if="hasNoPendingInvites">
      {{ $t("components_clans_pendinginvitespanel.nonepending") }}
    </v-card-subtitle>
    <table class="custom-table" v-if="!hasNoPendingInvites">
      <tr v-for="member in playersClan.pendingInvites" :key="member">
        <td>
          <v-row class="justify-space-between align-center ma-0">
            <v-col class="pa-0">
              <span class="pointer" @click="goToPlayer(member)">
                {{ battleTagToName(member) }}
              </span>
            </v-col>
            <v-col class="text-right pa-0">
              <v-btn @click="revokeInvite(member)">
                <v-icon>{{ mdiDelete }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import { getProfileUrl } from "@/helpers/url-functions";
import { Clan } from "@/store/clan/types";
import { useClanStore } from "@/store/clan/store";
import { mdiDelete } from "@mdi/js";
import { useRouter } from "vue-router/composables";
import { battleTagToName } from "@/helpers/profile";

export default defineComponent({
  name: "PendingInvitesPanel",
  components: {},
  setup() {
    const router = useRouter();
    const clanStore = useClanStore();

    const playersClan = computed<Clan>(() => clanStore.playersClan);
    const hasNoPendingInvites = computed<boolean>(() => playersClan.value?.pendingInvites?.length === 0);

    async function revokeInvite(member: string): Promise<void> {
      await clanStore.revokeInvite(member);
      await clanStore.retrievePlayersClan();
    }

    function goToPlayer(battleTag: string): void {
      router.push({ path: getProfileUrl(battleTag) });
    }

    onMounted(async (): Promise<void> => {
      await clanStore.retrievePlayersClan();
    });

    return {
      mdiDelete,
      playersClan,
      hasNoPendingInvites,
      goToPlayer,
      revokeInvite,
      battleTagToName,
    };
  },
});
</script>
