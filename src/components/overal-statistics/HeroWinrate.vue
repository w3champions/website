<template>
  <v-card-text>
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(0, value)"
      label="Select Mode"
      outlined
    />
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(1, value)"
      label="Select Mode"
      outlined
    />
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(2, value)"
      label="Select Mode"
      outlined
    />
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(3, value)"
      label="Select Mode"
      outlined
    />
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(4, value)"
      label="Select Mode"
      outlined
    />
    <v-select
      :items="heroes"
      item-text="name"
      item-value="heroId"
      @change="value => setHero(5, value)"
      label="Select Mode"
      outlined
    />
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class HeroWinrate extends Vue {
  public selectedIds = ["all", "all", "all", "all", "all", "all"];

  get size() {
    return this.$store.direct.state.overallStatistics.heroWinrate.winrate;
  }

  setHero(index: number, heroId: string) {
    this.selectedIds[index] = heroId;
  }

  get heroes() {
    return [
      { name: "All", heroId: "all"  },
      { name: "None", heroId: "none"  },

      { name: this.$t(`heroNames.archmage`), heroId: "archmage"  },
      { name: this.$t(`heroNames.mountainking`), heroId: "mountainking"  },
      { name: this.$t(`heroNames.paladin`), heroId: "paladin"  },
      { name: this.$t(`heroNames.sorceror`), heroId: "sorceror"  },

      { name: this.$t(`heroNames.farseer`), heroId: "farseer"  },
      { name: this.$t(`heroNames.blademaster`), heroId: "blademaster"  },
      { name: this.$t(`heroNames.shadowhunter`), heroId: "shadowhunter"  },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain"  },

      { name: this.$t(`heroNames.deathknight`), heroId: "deathknight"  },
      { name: this.$t(`heroNames.lich`), heroId: "lich"  },
      { name: this.$t(`heroNames.dreadlord`), heroId: "dreadlord"  },
      { name: this.$t(`heroNames.cryptlord`), heroId: "cryptlord"  },

      { name: this.$t(`heroNames.demonhunter`), heroId: "demonhunter"  },
      { name: this.$t(`heroNames.keeperofthegrove`), heroId: "keeperofthegrove"  },
      { name: this.$t(`heroNames.warden`), heroId: "warden"  },
      { name: this.$t(`heroNames.priestessofthemoon`), heroId: "priestessofthemoon"  },

      { name: this.$t(`heroNames.avatarofflame`), heroId: "avatarofflame"  },
      { name: this.$t(`heroNames.bansheeranger`), heroId: "bansheeranger"  },
      { name: this.$t(`heroNames.beastmaster`), heroId: "beastmaster"  },
      { name: this.$t(`heroNames.pandarenbrewmaster`), heroId: "pandarenbrewmaster"  },
      { name: this.$t(`heroNames.pitlord`), heroId: "pitlord"  },
      { name: this.$t(`heroNames.seawitch`), heroId: "seawitch"  },
      { name: this.$t(`heroNames.taurenchieftain`), heroId: "taurenchieftain"  },
      { name: this.$t(`heroNames.tinker`), heroId: "tinker"  },
      { name: this.$t(`heroNames.alchemist`), heroId: "alchemist"  },
    ]
  }
}
</script>
