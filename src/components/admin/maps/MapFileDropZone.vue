<template>
  <div
    class="map-dropzone pa-6 text-center"
    :class="{
      'map-dropzone--active': isDragActive,
      'map-dropzone--disabled': disabled,
    }"
    role="button"
    tabindex="0"
    :aria-disabled="disabled"
    @click="openFilePicker"
    @keydown.enter.prevent="openFilePicker"
    @keydown.space.prevent="openFilePicker"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      class="d-none"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="onInputChange"
    />

    <v-icon size="48" :color="isDragActive ? 'primary' : 'medium-emphasis'">
      {{ mdiCloudUploadOutline }}
    </v-icon>
    <div class="text-subtitle-1 mt-2">{{ label }}</div>
    <div class="text-caption text-medium-emphasis">
      or click to browse &middot; {{ accept }}
    </div>

    <div v-if="rejected.length" class="text-caption text-error mt-2">
      Ignored {{ rejected.length }} file{{ rejected.length === 1 ? "" : "s" }} with an unsupported
      type: {{ rejected.join(", ") }}
    </div>

    <div v-if="modelValue.length" class="d-flex flex-wrap justify-center ga-2 mt-4">
      <v-chip
        v-for="(selectedFile, index) in modelValue"
        :key="`${selectedFile.name}-${index}`"
        closable
        color="primary"
        variant="flat"
        :disabled="disabled"
        @click.stop
        @click:close.stop="removeFile(index)"
      >
        {{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})
      </v-chip>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { mdiCloudUploadOutline } from "@mdi/js";

export default defineComponent({
  name: "MapFileDropZone",
  props: {
    modelValue: {
      type: Array as PropType<File[]>,
      default: () => [],
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    accept: {
      type: String,
      default: ".w3m,.w3x",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: "Drag & drop map files here",
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const fileInput = ref<HTMLInputElement | null>(null);
    // Dragging over a child element fires dragleave on the parent, so track the
    // enter/leave pairs instead of toggling a boolean.
    const dragDepth = ref<number>(0);
    const rejected = ref<string[]>([]);

    const isDragActive = computed<boolean>(() => dragDepth.value > 0 && !props.disabled);

    const acceptedExtensions = computed<string[]>(() =>
      props.accept
        .split(",")
        .map((extension) => extension.trim().toLowerCase())
        .filter(Boolean)
    );

    function isAccepted(file: File): boolean {
      if (acceptedExtensions.value.length === 0) return true;
      return acceptedExtensions.value.some((extension) => file.name.toLowerCase().endsWith(extension));
    }

    function openFilePicker(): void {
      if (props.disabled) return;
      fileInput.value?.click();
    }

    function onDragEnter(): void {
      if (props.disabled) return;
      dragDepth.value++;
    }

    function onDragOver(event: DragEvent): void {
      if (props.disabled || !event.dataTransfer) return;
      event.dataTransfer.dropEffect = "copy";
    }

    function onDragLeave(): void {
      dragDepth.value = Math.max(0, dragDepth.value - 1);
    }

    function onDrop(event: DragEvent): void {
      dragDepth.value = 0;
      if (props.disabled) return;
      setFiles(Array.from(event.dataTransfer?.files ?? []));
    }

    function onInputChange(event: Event): void {
      const input = event.target as HTMLInputElement;
      setFiles(Array.from(input.files ?? []));
      // Reset so picking the same file again still fires a change event.
      input.value = "";
    }

    function setFiles(incoming: File[]): void {
      if (incoming.length === 0) return;

      rejected.value = incoming.filter((file) => !isAccepted(file)).map((file) => file.name);
      const accepted = incoming.filter(isAccepted);
      if (accepted.length === 0) return;

      emit("update:modelValue", props.multiple ? [...props.modelValue, ...accepted] : [accepted[0]]);
    }

    function removeFile(index: number): void {
      if (props.disabled) return;
      const remaining = [...props.modelValue];
      remaining.splice(index, 1);
      emit("update:modelValue", remaining);
    }

    function formatSize(bytes: number): string {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return {
      mdiCloudUploadOutline,
      fileInput,
      isDragActive,
      rejected,
      openFilePicker,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      onInputChange,
      removeFile,
      formatSize,
    };
  },
});
</script>

<style lang="scss" scoped>
.map-dropzone {
  border: 2px dashed rgba(var(--v-border-color), 0.38);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.04);
  }

  &--active {
    border-color: rgb(var(--v-theme-primary));
    border-style: solid;
    background-color: rgba(var(--v-theme-primary), 0.08);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;

    &:hover {
      border-color: rgba(var(--v-border-color), 0.38);
      background-color: transparent;
    }
  }
}
</style>
