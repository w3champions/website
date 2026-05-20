<template>
  <button ref="btnEl" class="faction-btn" @click.stop="toggleOpen">
    <span class="faction-sigil">{{ current.sigil }}</span>
    <span class="faction-label d-none d-sm-inline">{{ current.name }}</span>
    <span class="faction-caret">▾</span>
  </button>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownEl"
      class="faction-dropdown open"
      :class="`t-${currentThemeName}`"
      :style="dropdownStyle"
    >
      <button
        v-for="f in factions"
        :key="f.id"
        class="faction-opt"
        @click="select(f.id)"
      >
        <span class="faction-opt-swatch" :style="{ background: f.color }">{{ f.sigil }}</span>
        <div>
          <span class="faction-opt-name">{{ f.name }}</span>
          <small class="faction-opt-desc">{{ f.desc }}</small>
        </div>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useTheme } from "vuetify";

const emit = defineEmits<{
  (e: "select", id: string): void;
}>();

const theme = useTheme();
const isOpen = ref(false);
const btnEl = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const factions = [
  { id: "human",    name: "Human",     sigil: "⚔", color: "#1a5fa8", desc: "Royal blue & gold · Alliance" },
  { id: "orc",      name: "Orc",       sigil: "⚒", color: "#7a3010", desc: "Rust & deep green · Horde" },
  { id: "undead",   name: "Undead",    sigil: "☠", color: "#5b2c8c", desc: "Deep purple & bone" },
  { id: "nightelf", name: "Night Elf", sigil: "🌙", color: "#265c43", desc: "Forest & lunar silver" },
];

const currentThemeName = computed(() => theme.global.name.value);

const current = computed(() => factions.find((f) => f.id === currentThemeName.value) ?? factions[0]);

// Theme-aware colors for the teleported dropdown (outside .v-application cascade)
const themeColors: Record<string, { bg: string; border: string }> = {
  human:    { bg: "rgba(242, 234, 214, 0.98)", border: "#b8943c" },
  orc:      { bg: "rgba(210, 190, 155, 0.98)", border: "#a76c3a" },
  undead:   { bg: "rgba(14, 8, 22, 0.98)",     border: "#6b3da0" },
  nightelf: { bg: "rgba(6, 20, 13, 0.98)",      border: "#2e6e4d" },
};

function toggleOpen() {
  if (!isOpen.value && btnEl.value) {
    const rect = btnEl.value.getBoundingClientRect();
    const colors = themeColors[currentThemeName.value] ?? themeColors.human;
    dropdownStyle.value = {
      position: "fixed",
      top: `${rect.bottom + 6}px`,
      right: `${window.innerWidth - rect.right}px`,
      background: colors.bg,
      borderColor: colors.border,
      zIndex: "9999",
    };
  }
  isOpen.value = !isOpen.value;
}

function select(id: string) {
  isOpen.value = false;
  emit("select", id);
}

function handleOutsideClick(e: MouseEvent) {
  const target = e.target as Node;
  if (!btnEl.value?.contains(target) && !dropdownEl.value?.contains(target)) {
    isOpen.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener("click", handleOutsideClick));
</script>
