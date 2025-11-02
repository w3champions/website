<template>
  <div>
    <v-card-title class="pt-3">
      {{ $t("components_clans_pendinginvitespanel.invitespending") }}
    </v-card-title>
    <v-card-subtitle v-if="hasNoPendingInvites">
      {{ $t("components_clans_pendinginvitespanel.nonepending") }}
    </v-card-subtitle>
    <table v-if="!hasNoPendingInvites" class="custom-table">
      <tr v-for="member in playersClan.pendingInvites" :key="member">
        <td>
          <v-row class="align-center" no-gutters>
            <v-col>
              <span class="cursor-pointer" @click="goToPlayer(member)">
                {{ battleTagToName(member) }}
              </span>
            </v-col>
            <v-col class="text-right">
              <v-btn size="small" variant="outlined" @click="revokeInvite(member)">
                <v-icon size="x-large">{{ mdiDelete }}</v-icon>
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
import { useRouter } from "vue-router";
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
      battleTagToName
    };
  },
});
</script>
