<template>
  <div class="announcement-editor">
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
      <span class="text-subtitle-1">{{ label }}</span>
      <div class="d-flex ga-1">
        <v-btn type="button" size="small" :variant="mode === 'visual' ? 'tonal' : 'text'" :aria-pressed="mode === 'visual'" :disabled="htmlOnly" @click="setMode('visual')">Visual</v-btn>
        <v-btn type="button" size="small" :variant="mode === 'html' ? 'tonal' : 'text'" :aria-pressed="mode === 'html'" @click="setMode('html')">HTML</v-btn>
      </div>
    </div>
    <v-alert v-if="htmlOnly" type="info" variant="tonal" density="compact" class="mb-3">This message uses custom HTML formatting. Edit it in HTML mode to preserve it.</v-alert>
    <v-input :model-value="preparedHtml" :rules="rules" class="announcement-editor__input">
      <div class="announcement-editor__field">
        <template v-if="mode === 'visual' && editor">
          <div class="announcement-editor__toolbar" role="toolbar" aria-label="Text formatting">
            <v-btn
              v-for="control in controls"
              :key="control.label"
              type="button"
              variant="text"
              size="small"
              :icon="control.icon"
              :aria-label="control.label"
              :title="control.label"
              :aria-pressed="control.active?.() ?? false"
              @mousedown.prevent
              @click="control.run()"
            />
            <label class="announcement-editor__color" title="Text color">
              <span class="text-caption">Color</span>
              <input type="color" aria-label="Text color" :value="color" @input="applyColor" />
            </label>
            <v-btn type="button" variant="text" size="small" aria-label="Reset text color" title="Reset text color" @mousedown.prevent @click="resetColor">Reset color</v-btn>
          </div>
          <editor-content :editor="editor" class="announcement-editor__visual" />
        </template>
        <textarea v-else class="announcement-editor__html" :aria-label="`${label} HTML`" :value="modelValue" spellcheck="false" @input="updateHtml"></textarea>
      </div>
    </v-input>
    <div class="d-flex justify-space-between flex-wrap ga-2 text-caption mb-4">
      <span>HTTP(S) URLs become clickable links when saved.</span>
      <span v-if="maxLength" :class="{ 'text-error': preparedHtml.length > maxLength }">{{ preparedHtml.length }} / {{ maxLength }} (including HTML)</span>
    </div>

    <v-dialog v-model="urlDialog" max-width="480">
      <v-card :title="urlKind === 'link' ? 'Edit link' : 'Insert image'">
        <v-card-text>
          <v-text-field v-model="url" label="HTTP(S) URL" :error-messages="url && !validUrl ? 'Enter a valid HTTP(S) URL' : undefined" @keydown.enter.prevent="applyUrl" />
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="urlKind === 'link'" type="button" @click="removeLink">Remove link</v-btn>
          <v-spacer />
          <v-btn type="button" @click="urlDialog = false">Cancel</v-btn>
          <v-btn type="button" :disabled="!validUrl" @click="applyUrl">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import "@/scss/fonts/friz.scss";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import type { Editor } from "@tiptap/core";
import { mdiCodeTags, mdiFileImage, mdiFormatBold, mdiFormatHeader1, mdiFormatHeader2, mdiFormatHeader3, mdiFormatItalic, mdiFormatListBulleted, mdiFormatListNumbered, mdiFormatParagraph, mdiFormatStrikethrough, mdiFormatUnderline, mdiLink, mdiMinus, mdiRedo, mdiUndo } from "@mdi/js";
import { linkifyAnnouncementHtml } from "@/helpers/announcementHtml";
import { announcementExtensions, needsHtmlMode } from "./announcementExtensions";

const props = withDefaults(defineProps<{ modelValue: string; label?: string; maxLength?: number }>(), { label: "Announcement", maxLength: 0 });
const emit = defineEmits<{ "update:modelValue": [html: string] }>();
const htmlOnly = computed(() => needsHtmlMode(props.modelValue));
const mode = ref<"visual" | "html">(htmlOnly.value ? "html" : "visual");
const color = ref("#ffd428");
const preparedHtml = computed(() => linkifyAnnouncementHtml(props.modelValue));
const rules = computed(() => [() => !props.maxLength || preparedHtml.value.length <= props.maxLength || `Max ${props.maxLength} characters, including HTML and generated links`]);
const editor = useEditor({
  extensions: announcementExtensions(),
  content: htmlOnly.value ? "" : props.modelValue,
  editorProps: { attributes: { role: "textbox", "aria-label": props.label, "aria-multiline": "true" } },
  onCreate: ({ editor: current }) => syncColor(current),
  onSelectionUpdate: ({ editor: current }) => syncColor(current),
  onUpdate: ({ editor: current }) => {
    syncColor(current);
    emit("update:modelValue", current.getHTML());
  },
});

watch(() => props.modelValue, (html) => {
  if (htmlOnly.value) {
    mode.value = "html";
    return;
  }
  if (editor.value && editor.value.getHTML() !== html) editor.value.commands.setContent(html, false);
  if (editor.value) syncColor(editor.value);
});

function setMode(next: "visual" | "html") {
  if (next === "visual" && htmlOnly.value) return;
  if (next === "visual" && mode.value !== next && editor.value) {
    editor.value.commands.setContent(props.modelValue, false);
    syncColor(editor.value);
    emit("update:modelValue", editor.value.getHTML());
  }
  mode.value = next;
}

function updateHtml(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
}

function applyColor(event: Event) {
  color.value = (event.target as HTMLInputElement).value;
  editor.value?.chain().focus().setColor(color.value).run();
}

function syncColor(current: Editor) {
  const value = String(current.getAttributes("textStyle").color || current.getAttributes("heading").color || current.getAttributes("paragraph").color || current.getAttributes("listItem").color || current.getAttributes("bulletList").color || current.getAttributes("orderedList").color || (current.isActive("heading") ? "#ffd428" : "#ffffff"));
  if (/^#[\da-f]{6}$/i.test(value)) {
    color.value = value;
    return;
  }
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.append(probe);
  const channels = window.getComputedStyle(probe).color.match(/\d+/g);
  probe.remove();
  if (channels && channels.length >= 3) color.value = `#${channels.slice(0, 3).map((channel) => Number(channel).toString(16).padStart(2, "0")).join("")}`;
}

function resetColor() {
  editor.value?.chain().focus().unsetColor().updateAttributes("heading", { color: null }).updateAttributes("paragraph", { color: null }).updateAttributes("bulletList", { color: null }).updateAttributes("orderedList", { color: null }).updateAttributes("listItem", { color: null }).run();
}

const urlDialog = ref(false);
const urlKind = ref<"link" | "image">("link");
const url = ref("");
const validUrl = computed(() => {
  if (!/^https?:\/\//i.test(url.value)) return false;
  try {
    return !!new URL(url.value).hostname;
  } catch {
    return false;
  }
});

function editUrl(kind: "link" | "image") {
  urlKind.value = kind;
  url.value = kind === "link" ? String(editor.value?.getAttributes("link").href ?? "") : "";
  urlDialog.value = true;
}

function applyUrl() {
  if (!validUrl.value || !editor.value) return;
  if (urlKind.value === "image") editor.value.chain().focus().setImage({ src: url.value }).run();
  else if (editor.value.state.selection.empty && !editor.value.isActive("link")) editor.value.chain().focus().insertContent({ type: "text", text: url.value, marks: [{ type: "link", attrs: { href: url.value } }] }).run();
  else editor.value.chain().focus().extendMarkRange("link").setLink({ href: url.value }).run();
  urlDialog.value = false;
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange("link").unsetLink().run();
  urlDialog.value = false;
}

const controls = computed(() => {
  const current = editor.value;
  if (!current) return [];
  return [
    { label: "Bold", icon: mdiFormatBold, active: () => current.isActive("bold"), run: () => current.chain().focus().toggleBold().run() },
    { label: "Italic", icon: mdiFormatItalic, active: () => current.isActive("italic"), run: () => current.chain().focus().toggleItalic().run() },
    { label: "Underline", icon: mdiFormatUnderline, active: () => current.isActive("underline"), run: () => current.chain().focus().toggleUnderline().run() },
    { label: "Strikethrough", icon: mdiFormatStrikethrough, active: () => current.isActive("strike"), run: () => current.chain().focus().toggleStrike().run() },
    { label: "Inline code", icon: mdiCodeTags, active: () => current.isActive("code"), run: () => current.chain().focus().toggleCode().run() },
    { label: "Paragraph", icon: mdiFormatParagraph, run: () => current.chain().focus().setParagraph().run() },
    ...([1, 2, 3] as const).map((level, index) => ({ label: `Heading ${level}`, icon: [mdiFormatHeader1, mdiFormatHeader2, mdiFormatHeader3][index], active: () => current.isActive("heading", { level }), run: () => current.chain().focus().toggleHeading({ level }).run() })),
    { label: "Bullet list", icon: mdiFormatListBulleted, active: () => current.isActive("bulletList"), run: () => current.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: mdiFormatListNumbered, active: () => current.isActive("orderedList"), run: () => current.chain().focus().toggleOrderedList().run() },
    { label: "Edit link", icon: mdiLink, active: () => current.isActive("link"), run: () => editUrl("link") },
    { label: "Insert image", icon: mdiFileImage, run: () => editUrl("image") },
    { label: "Horizontal rule", icon: mdiMinus, run: () => current.chain().focus().setHorizontalRule().run() },
    { label: "Undo", icon: mdiUndo, run: () => current.chain().focus().undo().run() },
    { label: "Redo", icon: mdiRedo, run: () => current.chain().focus().redo().run() },
  ];
});

</script>

<style scoped>
.announcement-editor { width: 100%; }
.announcement-editor__input { display: block; }
.announcement-editor__field { width: 100%; border: 1px solid rgba(var(--v-theme-on-surface), 0.4); border-radius: 4px; overflow: hidden; }
.announcement-editor__field:focus-within { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -1px; }
.announcement-editor__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 2px; padding: 6px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.2); }
.announcement-editor__color { display: flex; align-items: center; gap: 6px; padding: 0 8px; }
.announcement-editor__color input { width: 30px; height: 30px; cursor: pointer; }
.announcement-editor__html { display: block; width: 100%; min-height: 220px; padding: 16px; color: inherit; font: 14px/1.5 monospace; resize: vertical; }
.announcement-editor__visual :deep(.tiptap) { min-height: 220px; max-height: 500px; padding: 16px; overflow-y: auto; overflow-wrap: anywhere; outline: none; color: #fff; background: #111; font: 18px/1.4 "Friz Quadrata Std Medium", serif; }
.announcement-editor__visual :deep(h1), .announcement-editor__visual :deep(h2), .announcement-editor__visual :deep(h3), .announcement-editor__visual :deep(h4), .announcement-editor__visual :deep(h5), .announcement-editor__visual :deep(h6) { margin: 1rem 0 0.75rem; color: #ffd428; font-family: "Friz Quadrata Std Bold", serif; font-weight: normal; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); }
.announcement-editor__visual :deep(h1) { font-size: 1.5rem; }
.announcement-editor__visual :deep(h2) { font-size: 1.4rem; }
.announcement-editor__visual :deep(h3) { font-size: 1.3rem; }
.announcement-editor__visual :deep(h4) { font-size: 1.2rem; }
.announcement-editor__visual :deep(h5), .announcement-editor__visual :deep(h6) { font-size: 1rem; }
.announcement-editor__visual :deep(p) { margin: 0.75rem 0; }
.announcement-editor__visual :deep(ul), .announcement-editor__visual :deep(ol) { margin: 0.75rem 0; padding-left: 1.5rem; }
.announcement-editor__visual :deep(li) { margin: 0.25rem 0; }
.announcement-editor__visual :deep(a) { color: #4fc3f7; text-decoration: none; }
.announcement-editor__visual :deep(a:hover) { color: #81d4fa; text-decoration: underline; }
.announcement-editor__visual :deep(strong) { font-family: "Friz Quadrata Std Bold", serif; font-weight: normal; }
.announcement-editor__visual :deep(em) { font-family: "Friz Quadrata Std Italic", serif; font-style: normal; }
.announcement-editor__visual :deep(strong em), .announcement-editor__visual :deep(em strong) { font-family: "Friz Quadrata Std Bold Italic", serif; }
.announcement-editor__visual :deep(code) { padding: 0.2rem 0.5rem; color: #81d4fa; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; font: 0.9rem "Courier New", monospace; }
.announcement-editor__visual :deep(hr) { margin: 1.5rem 0; border: 0; border-top: 1px solid rgba(255, 255, 255, 0.2); }
.announcement-editor__visual :deep(img) { max-width: 100%; height: auto; margin: 1rem 0; border-radius: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
</style>
