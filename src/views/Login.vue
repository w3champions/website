<template>
  <div>
    <div>Token: {{ code }}</div>
    <div>Bearer: {{ bearer }}</div>
    <div>AccountName: {{ account }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LoginView extends Vue {
  @Prop() public code!: string;

  mounted() {
    this.$store.direct.dispatch.oauth.authorizeWithCode(this.code);
  }

  get bearer(): string {
    return this.$store.direct.state.oauth.bearer;
  }

  get account(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }
}
</script>
