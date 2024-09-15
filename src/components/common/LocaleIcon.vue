<template>
  <v-container class="pa-0">
    <v-row class="pa-0" align="center" justify="center">
      <v-col>
        <img :src="flag()" width="22px" height="22px" :alt="locale.toUpperCase()" />
      </v-col>
      <v-col v-if="showTwoLetterCode">{{ locale.toUpperCase() }}</v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "LocaleIcon",
  components: {},
  props: {
    locale: {
      type: String,
      required: true,
    },
    showTwoLetterCode: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props) {
    function flag(): string {
      return `/assets/localeFlags/${props.locale}.svg`;
    }
    return {
      flag,
    };
  },
});
</script>
