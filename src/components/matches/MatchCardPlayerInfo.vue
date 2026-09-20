<template>
  <div class="match-card-player" :class="left ? 'match-card-player--left' : 'match-card-player--right'">
    <!-- Outer race shield -->
    <div class="race-shield" :class="`race-shield--${raceName}`">
      <img class="race-shield__icon" :src="raceShieldSrc" alt="" />
      <span v-if="isRandomRace" class="race-shield__random-mark">?</span>
    </div>

    <!-- Player info block -->
    <div class="player-info-block">
      <!-- Name row -->
      <div class="player-name-row">
        <v-tooltip location="top" transition="none" content-class="w3-tooltip elevation-1">
          <template #activator="{ props: tooltipProps }">
            <a
              class="player-name truncated-name"
              :class="[playerColorClass, highlighted ? 'font-weight-bold' : '']"
              v-bind="tooltipProps"
              @click="notClickable ? null : goToPlayer()"
              @click.middle="openInNewTab()"
              @click.right="openInNewTab()"
            >
              {{ nameWithoutBtag }}
            </a>
          </template>
          <div>
            <div v-if="displayRating !== null">
              MMR: <span :class="{ 'spoiler-mask': hideWinnerSpoilers }">{{ displayRating }}<span v-if="displayMmrChange !== 0" class="number-text" :class="playerColorClass"><span v-if="displayMmrChange > 0">+</span>{{ displayMmrChange }}</span></span>
            </div>
            <div v-else>MMR: {{ $t("components_matches_playermatchinfo.calibrating") }}</div>
          </div>
        </v-tooltip>
      </div>

      <!-- MMR row -->
      <div class="player-mmr-row" :class="{ 'spoiler-mask': hideWinnerSpoilers }">
        <span v-if="displayRating !== null" class="mmr-text">
          MMR: {{ displayRating }}
          <span v-if="displayMmrChange !== 0" class="mmr-change number-text" :class="playerColorClass">
            <span v-if="displayMmrChange > 0">+</span>{{ displayMmrChange }}
            <v-icon v-if="displayMmrChange > 0" size="12" color="success">mdi-trending-up</v-icon>
            <v-icon v-else size="12" color="error">mdi-trending-down</v-icon>
          </span>
        </span>
        <span v-else class="mmr-text mmr-calibrating">{{ $t("components_matches_playermatchinfo.calibrating") }}</span>
      </div>

      <!-- Secondary heroes (heroes[1], heroes[2]) -->
      <div v-if="secondaryHeroes.length > 0" class="secondary-heroes">
        <img
          v-for="(hero, idx) in secondaryHeroes"
          :key="idx"
          class="secondary-hero-img"
          :src="heroSrc(hero)"
          :width="28"
          :height="28"
          :data-tip="heroTooltip(hero)"
          loading="lazy"
          decoding="async"
          alt=""
          @error="onHeroImgError"
        />
      </div>
    </div>

    <!-- Centre hero shield (heroes[0]) -->
    <div class="hero-shield-wrapper">
      <!-- Outer shield: provides the metallic border -->
      <div class="hero-shield" :class="`hero-shield--${raceName}`">
        <!-- Inner shield: clips and displays the portrait -->
        <div class="hero-shield__inner">
          <img
            v-if="primaryHero"
            class="hero-shield__img"
            :src="heroSrc(primaryHero)"
            :data-tip="heroTooltip(primaryHero)"
            loading="lazy"
            decoding="async"
            alt=""
            @error="onHeroImgError"
          />
          <span v-else class="hero-shield__placeholder" :class="`race-icon-${raceIconClass} race-avatar-fallback`"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import { useRouter } from "vue-router";
import isNil from "lodash/isNil";
import { ERaceEnum, type Hero, type PlayerInTeam } from "@/store/types";
import { getAsset, getProfileUrl } from "@/helpers/url-functions";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";
import { useI18n } from "vue-i18n";

export default defineComponent({
  name: "MatchCardPlayerInfo",
  props: {
    player: {
      type: Object as PropType<PlayerInTeam>,
      required: true,
    },
    /** Whether this component is on the left side (player info flips to be right-aligned) */
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
    notClickable: {
      type: Boolean,
      required: true,
    },
    unfinishedMatch: {
      type: Boolean,
      required: true,
    },
    highlighted: {
      type: Boolean,
      required: false,
      default: false,
    },
    spoilerFreeWinner: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const spoilerFreeStore = useSpoilerFreeStore();
    const fakeMmrValue = 2000;

    const won = computed<string>(() => {
      if (props.unfinishedMatch) return "";
      if (Object.prototype.hasOwnProperty.call(props.player, "won")) {
        return props.player.won ? "w3-won" : "w3-lost";
      }
      return "";
    });

    const hideWinnerSpoilers = computed<boolean>(
      () => props.spoilerFreeWinner && spoilerFreeStore.hideWinner && !props.unfinishedMatch,
    );

    const playerColorClass = computed<string>(() => {
      if (hideWinnerSpoilers.value) return "w3-gray-gold-text";
      return won.value;
    });

    const currentRating = computed<number | null>(() =>
      props.player.oldMmr != null ? Math.floor(props.player.oldMmr) : null,
    );

    const displayRating = computed<number | null>(() => {
      if (currentRating.value === null) return null;
      if (hideWinnerSpoilers.value) return fakeMmrValue;
      return currentRating.value;
    });

    const mmrChange = computed<number>(() => {
      if (props.player.oldMmr && props.player.currentMmr) {
        return Math.floor(props.player.currentMmr - props.player.oldMmr);
      }
      return 0;
    });

    const displayMmrChange = computed<number>(() => {
      if (hideWinnerSpoilers.value) return 0;
      return mmrChange.value;
    });

    const nameWithoutBtag = computed<string>(() => props.player.name);

    // Friendly race name string for CSS class suffixes
    const raceName = computed<string>(() => {
      const effectiveRace = props.player.rndRace ?? props.player.race;
      return ERaceEnum[effectiveRace] ?? "RANDOM";
    });

    const isRandomRace = computed<boolean>(() => {
      return props.player.race === ERaceEnum.RANDOM;
    });

    const raceShieldSrc = computed<string>(() => {
      let effectiveRace = props.player.rndRace ?? props.player.race;
      if (effectiveRace === ERaceEnum.RANDOM || effectiveRace === ERaceEnum.TOTAL) {
        effectiveRace = ERaceEnum.HUMAN; // fallback
      }
      const raceStr = ERaceEnum[effectiveRace];
      return `/assets/raceShields/${raceStr}.png`;
    });

    // Hero helpers
    const heroes = computed<Hero[]>(() => props.player.heroes ?? []);
    const primaryHero = computed<Hero | null>(() => heroes.value[0] ?? null);
    const secondaryHeroes = computed<Hero[]>(() => {
      const rest = heroes.value.slice(1);
      return props.left ? rest.toReversed() : rest;
    });

    function heroSrc(hero: Hero): string {
      return getAsset(`heroes/${hero.name}.png`);
    }

    function heroTooltip(hero: Hero): string {
      return `${t(`heroNames.${hero.name}`)} (${t("common.level")} ${hero.level})`;
    }

    function onHeroImgError(e: Event): void {
      const target = e.target as HTMLImageElement;
      target.src = getAsset("heroes/all.png");
    }

    function goToPlayer(): void {
      if (props.unfinishedMatch) return;
      router.push({ path: getProfileUrl(props.player.battleTag) }).catch((err) => err);
    }

    function openInNewTab(): void {
      if (props.unfinishedMatch) return;
      window.open(getProfileUrl(props.player.battleTag), "_blank");
    }

    return {
      won,
      playerColorClass,
      hideWinnerSpoilers,
      displayRating,
      displayMmrChange,
      nameWithoutBtag,
      raceName,
      isRandomRace,
      raceShieldSrc,
      primaryHero,
      secondaryHeroes,
      heroSrc,
      heroTooltip,
      onHeroImgError,
      goToPlayer,
      openInNewTab,
      isNil,
    };
  },
});
</script>

<style lang="scss" scoped>
// ── Layout ──────────────────────────────────────────────────

.match-card-player {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

// Left side: race shield on far left, hero shield on the right (near centre)
.match-card-player--left {
  flex-direction: row;
  .player-info-block {
    align-items: flex-end;
    text-align: right;
  }
}

// Right side: hero shield on left (near centre), race shield on far right
.match-card-player--right {
  flex-direction: row-reverse;
  .player-info-block {
    align-items: flex-start;
    text-align: left;
  }
}

// ── Race Shield (outer) ──────────────────────────────────────

.race-shield {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.race-shield--HUMAN     { filter: drop-shadow(0 0 7px rgba(70, 130, 250, 0.7)); }
.race-shield--ORC       { filter: drop-shadow(0 0 3px rgba(182, 76, 76, 0.7)); }
.race-shield--UNDEAD    { filter: drop-shadow(0 0 7px rgba(72, 0, 128, 0.7)); }
.race-shield--NIGHT_ELF { filter: drop-shadow(0 0 3px rgba(75, 224, 112, 0.7)); }
.race-shield--RANDOM    { filter: drop-shadow(0 0 3px rgba(220, 180, 60, 0.7)); }

.race-shield__icon {
  width: 90px;
  height: 90px;
  object-fit: contain;
  display: block;
  position: relative;
  z-index: 1;
}

.race-shield__random-mark {
  position: absolute;
  z-index: 2;
  font-size: 56px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,1);
  font-family: Arial, sans-serif;
  line-height: 1;
}

// ── Player Info Block ────────────────────────────────────────

.player-info-block {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.player-name-row {
  display: flex;
  align-items: center;
}

.player-name {
  font-size: 1.35rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  max-width: 170px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.player-mmr-row {
  font-size: 0.87rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-weight: 400;
}

.mmr-change {
  font-size: 0.85rem;
  margin-left: 2px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
}

.mmr-calibrating {
  font-style: italic;
  opacity: 0.6;
}

.secondary-heroes {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-wrap: nowrap;
}

.secondary-hero-img {
  display: block;
  object-fit: contain;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

// ── Hero Shield (centre – heroes[0]) ───────────────────────────────
//
// Shape: heraldic shield with CURVED edges
//   • Top edge    : convex arch (Q quadratic bezier, peaks at y≈1)
//   • Side edges  : cubic beziers (C) – sweep slightly outward from
//                   the top corners, then arc inward to the bottom point
//
// Two-layer approach (both use CSS path() clip-path):
//   1. Outer .hero-shield        (70×86 px) — metallic gradient = "border"
//   2. Inner .hero-shield__inner (60×76 px) — inset portrait area
//
// Outer path (coordinate space 84×78):
//   M 6,10 Q 24,11 42,3 Q 60,11 78,10  ← top edge with central peak at x=42, y=3
//   C 88,40 76,70 42,78              ← right side sweeps out then to point
//   C 8,70 -4,40 6,10  Z             ← left side mirrors

$shield-width:  84px;
$shield-height: 78px;
$inner-w:       74px;   // 5 px border per side
$inner-h:       68px;

.hero-shield-wrapper {
  flex-shrink: 0;
  // padding gives drop-shadow room (clip-path trims it otherwise)
  padding: 6px 4px;
}

.hero-shield {
  clip-path: path('M 6,10 Q 24,8 42,6 Q 60,8 78,10 C 88,40 76,70 42,78 C 8,70 -4,40 6,10 Z');
  width:  $shield-width;
  height: $shield-height;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  // Metallic silver border — revealed as the "frame" around the inner
  background: linear-gradient(
    160deg,
    #d8d8d8 0%,
    #ffffff 18%,
    #b0b0b0 38%,
    #eeeeee 58%,
    #888888 78%,
    #cccccc 100%
  );

  // Drop-shadow applied via filter so it respects the curved clip-path
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.65));
}

// Race-coloured glow overlaid on the base shadow
.hero-shield--HUMAN     { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)) drop-shadow(0 0 7px rgba(70,130,220,0.55)); }
.hero-shield--ORC       { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)) drop-shadow(0 0 7px rgba(60,180,60,0.55)); }
.hero-shield--UNDEAD    { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)) drop-shadow(0 0 7px rgba(150,60,220,0.55)); }
.hero-shield--NIGHT_ELF { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)) drop-shadow(0 0 7px rgba(60,200,160,0.55)); }
.hero-shield--RANDOM    { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)) drop-shadow(0 0 7px rgba(220,180,60,0.55)); }

// Inner portrait area — same curved shape, scaled to 74×68 px
// Path: outer coords × (74/84, 68/78) ≈ (×0.881, ×0.872)
.hero-shield__inner {
  clip-path: path('M 5,9 Q 21,7 37,5 Q 53,7 69,9 C 78,35 67,62 37,68 C 7,62 -4,35 5,9 Z');
  width:    $inner-w;
  height:   $inner-h;
  overflow: hidden;
  position: relative;
  background: #15100a; // dark fallback behind portrait

  // Inset vignette for depth at the border edge
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.85);
    pointer-events: none;
    z-index: 2;
  }
}

.hero-shield__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%; // center the face, not just the top
  display: block;
  position: relative;
  z-index: 1;
}



.hero-shield__placeholder {
  width: 44px;
  height: 44px;
  background-position: center;
  background-size: cover;
  display: inline-block;
  opacity: 0.45;
}

.race-avatar-fallback {
  filter: grayscale(30%);
}

// ── Misc ────────────────────────────────────────────────

.spoiler-mask {
  filter: blur(6px);
}

.truncated-name {
  color: rgb(var(--v-theme-primary));
}
</style>
