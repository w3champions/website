<template>
  <v-container class="w3-container-width">
    <v-row v-if="!loading && matchDetail.match">
      <v-col cols="12">
        <match-detail-content :match-detail="matchDetail" :match-id="matchId" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from "vue";
import MatchDetailContent from "@/components/match-details/MatchDetailContent.vue";
import { MatchDetail } from "@/store/types";
import { useMatchStore } from "@/store/match/store";

export default defineComponent({
  name: "MatchDetailView",
  components: {
    MatchDetailContent,
  },
  props: {
    matchId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const matchStore = useMatchStore();
    const matchDetail = computed<MatchDetail>(() => matchStore.matchDetail);
    const loading = computed<boolean>(() => matchStore.loadingMatchDetail);

    onMounted((): void => {
      init();
    });

    watch(() => props.matchId, (): void => {
      init();
    });

    async function init(): Promise<void> {
      await matchStore.loadMatchDetail(props.matchId);
    }

    return {
      loading,
      matchDetail,
    };
  },
});
</script>
