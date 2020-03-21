<template>
  <div :class="textClass">
    <div :class="raceIcon(player.race)">
      <div class="mmr-marker">
        {{ mmr }}
      </div>
    </div>
    <div>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <a v-on="on" @mouseover="lazyLoadProfile" @click="goToPlayer(name)">
            {{ name }}
          </a>
          <div :class="won">
            <span v-if="won">{{ won }}</span>
            <span v-if="player.xpChange" :class="won">
              <span v-if="player.xpChange > 0"> +{{ player.xpChange }}</span>
              <span v-else> {{ player.xpChange }}</span>
            </span>
          </div>
        </template>
        <div v-if="profile.data">
          Wins: {{ profile.data.stats.total.wins }} | Losses:
          {{ profile.data.stats.total.losses }} | Total:
          {{ profile.data.stats.total.wins + profile.data.stats.total.losses }}
        </div>
        <div v-else>
          Wins: ... | Losses: ... | Total: ...
        </div>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

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
  public raceEnum = ERaceEnum;

  raceIcon(race: ERaceEnum) {
    const aligment = this.left ? "alignLeft" : "alignRight";
    return "race-icon " + " race-icon-" + this.raceEnum[race] + " " + aligment;
  }

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, "won")) {
      return this.player.won ? "won" : "lost";
    }

    return "";
  }

  get mmr() {
    return this.player.bucket;
  }

  get textClass() {
    return this.left ? "text-end" : "text-start";
  }

  get name() {
    return this.player.battleTag.split("#")[0];
  }

  public profile = {} as any;

  private async lazyLoadProfile() {
    if (!this.profile.account) {
      this.profile = await this.$store.direct.getters.profileService.retrieveRawProfile(
        this.name
      );
    }
  }

  public goToPlayer(playerName: string) {
    const parts = playerName.split("#");

    this.$router
      .push({
        path: "/player/" + parts[0] + "/" + parts[1]
      })
      .catch(err => {
        return;
      });
  }
}
</script>

<style lang="scss">
.race-icon {
  width: 64px;
  height: 64px;
}

.mmr-marker {
  background-color: #cdcdcd;
  width: 21px;
  height: 21px;
  font-size: 14px;
  line-height: 21px;
  border-radius: 10px;
  text-align: center;
  margin-left: 55px;
  margin-top: 54px;
}

.race-icon-HUMAN {
  background-image: url("../assets/raceIcons/HUMAN.jpg");
}

.race-icon-ORC {
  background-image: url("../assets/raceIcons/ORC.jpg");
}

.race-icon-UNDEAD {
  background-image: url("../assets/raceIcons/UNDEAD.jpg");
}

.race-icon-NIGHT_ELF {
  background-image: url("../assets/raceIcons/NIGHT_ELF.jpg");
}

.race-icon-RANDOM {
  background-image: url("../assets/raceIcons/RANDOM.jpg");
}

.won {
  color: green;
}

.lost {
  color: red;
}

.alignRight {
  float: right;
}

.alignLeft {
  float: left;
}
</style>
