<template>
  <v-dialog v-model="show" max-width="500" @click:outside="show = false">
    <v-card>
      <v-card-title class="justify-center">
        {{ name }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="`/assets/socials/QR/${name}_QR.png`" />
        </v-row>

        <v-row class="mt-2">
          <v-spacer />
          <v-btn @click.stop="show = false">Close</v-btn>
          <v-spacer />
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "AlternatePaymentsDialog",
  components: {},
  props: {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props, context) {
    const show = computed<boolean>({
      get(): boolean {
        return props.value;
      },
      set(val: boolean): void {
        context.emit("input", val);
      },
    });

    return {
      show,
    };
  },
});
</script>
