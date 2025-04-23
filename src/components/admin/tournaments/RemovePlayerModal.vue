<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Remove Player</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-select
              :items="players"
              v-model="battleTag"
              item-text="battleTag"
              item-value="battleTag"
              label="Player"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="cancel">
        {{ $t("views_admin.cancel") }}
      </v-btn>
      <v-btn color="primary" class="w3-race-bg--text" @click="save" :disabled="saving || battleTag.length === 0">
        {{ $t("views_admin.save") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { ITournament, ITournamentPlayer } from "@/store/tournaments/types";

export default defineComponent({
  name: "RemovePlayerModal",
  components: {},
  props: {
    tournament: {
      type: Object as PropType<ITournament>,
      required: true,
    },
    saving: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, context) {
    const battleTag = ref<string>("");

    const players = computed<ITournamentPlayer[]>(() => props.tournament.players);

    function cancel() {
      context.emit("cancel");
    }

    function save() {
      context.emit("save", battleTag.value);
    }

    return {
      battleTag,
      players,
      cancel,
      save,
    };
  },
});
</script>
