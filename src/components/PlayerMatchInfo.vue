<template>
  <div :class="textClass">
    <div>{{name}} (<v-icon style="font-size: 16px;">mdi-chevron-triple-up</v-icon>{{mmr}})</div>
    <div :class="won" >
      <span v-if="won">{{won}}</span><span v-else>Playing</span> as {{race}}
      <span v-if="player.xpChange" :class="won">| <span v-if="player.xpChange > 0">+</span>{{player.xpChange}} XP</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Match, ERaceEnum } from "../store/typings";

@Component({})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: {
    battleTag: string;
    race: ERaceEnum;
    bucket: number;
    won?: boolean;
    xpChange?: number;
  };

  @Prop() public left!: boolean;

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, 'won')) {
        return this.player.won ? 'won' : 'lost';
    }

    return '';
  }

  get color() {
    if (this.won === 'won') {
        return 'green';
    }

    if (this.won === 'lost') {
        return 'red';
    }

    return 'gray';
  }

  get mmr() {
    return this.player.bucket;
  }

  get textClass() {
      return this.left ? 'text-end' : 'text-start';
  }

  get race() {
    switch (this.player.race) {
      case ERaceEnum.RANDOM:
        return "Random";
      case ERaceEnum.HUMAN:
        return "Human";
      case ERaceEnum.ORC:
        return "Orc";
      case ERaceEnum.NIGHT_ELF:
        return "Night Elf";
      case ERaceEnum.UNDEAD:
        return "Undead";
    }

    return 'Unknown';
  }

  get name() {
    return this.player.battleTag;
  }
}
</script>

<style lang="scss" scoped>
.won {
    color: green;
}

.lost {
    color: red;
}
</style>