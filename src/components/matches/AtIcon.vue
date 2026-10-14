<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask :id="maskId">
        <rect width="100" height="100" fill="white" />
        <circle cx="68" cy="30" r="21" fill="black" />
        <path d="M 47 51 L 89 51 L 101 63 L 68 96 L 35 63 Z" fill="black" stroke="black" stroke-width="8" stroke-linejoin="miter" />
      </mask>
    </defs>

    <g :mask="`url(#${maskId})`">
      <circle cx="32" cy="20" r="17" />
      <path d="M 11 41 L 53 41 L 65 53 L 32 86 L -1 53 Z" />
    </g>

    <circle cx="68" cy="30" r="17" />
    <path d="M 47 51 L 89 51 L 101 63 L 68 96 L 35 63 Z" />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AtIcon",
  props: {
    size: {
      type: [Number, String],
      default: 24
    }
  },
  setup() {
    const maskId = "at-icon-mask-" + Math.random().toString(36).substring(2, 9);
    return { maskId };
  }
});
</script>
