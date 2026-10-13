// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent } from "vue";
import ReplacePortraitDialog from "./ReplacePortraitDialog.vue";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";

const mocks = vi.hoisted(() => ({
  preview: vi.fn(),
  replace: vi.fn(),
  files: vi.fn(),
  read: vi.fn(),
  upload: vi.fn(),
  optimize: vi.fn(),
  loadPortraits: vi.fn(),
  loadGroups: vi.fn(),
  addDefinition: vi.fn(),
}));
vi.mock("@/config/env", () => ({ API_URL: "/mock/", INGAME_STATIC_RESOURCES_URL: "/mock/" }));
vi.mock("@/services/admin/AdminService", () => ({ default: { previewPortraitReplacement: mocks.preview, replacePortrait: mocks.replace } }));
vi.mock("@/services/admin/CloudStorageService", () => ({ default: { fetchFiles: mocks.files, readFile: mocks.read, uploadFile: mocks.upload } }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "token" }) }));
vi.mock("@/store/admin/playerManagement/store", () => ({
  usePlayerManagementStore: () => ({
    allSpecialPortraits: [{ id: "120", groups: ["Supporters"] }],
    loadAllSpecialPortraits: mocks.loadPortraits,
    loadPortraitDefinitionGroups: mocks.loadGroups,
    addNewPortraitDefinition: mocks.addDefinition,
  }),
}));

const dialog = {
  props: ["modelValue"],
  emits: ["update:modelValue"],
  template: "<div><slot name='activator' :props='{ onClick: () => $emit(&quot;update:modelValue&quot;, true) }' /><slot v-if='modelValue' /></div>",
};
const card = { template: "<div><slot /><slot name='actions' /></div>" };
const button = { props: ["disabled"], template: "<button :disabled='disabled'><slot /></button>" };
const editor = defineComponent({
  name: "CropEditorStub",
  props: { file: { type: Object, required: true }, initialFrame: Boolean, disabled: Boolean },
  emits: ["prepared"],
  mounted() {
    this.$emit("prepared", mocks.optimize);
  },
  template: "<div>Source crop editor</div>",
});
const cleanup = { name: "PortraitCleanupDialog", props: ["modelValue"], template: "<div v-if='modelValue'>Cleanup prompt</div>" };
let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("URL", Object.assign(class extends URL {}, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
  mocks.preview.mockResolvedValue({ owners: 2, selectedProfiles: 1, rewardDefinitions: 1, replacementPortraitId: null });
  mocks.files.mockResolvedValue([{ name: "SPECIAL_120.jpg" }]);
  mocks.read.mockResolvedValue(new File(["original"], "SPECIAL_120.jpg"));
  mocks.optimize.mockResolvedValue(new File(["optimized"], "portrait.webp", { type: "image/webp" }));
  mocks.upload.mockResolvedValue({ isSuccess: true });
  mocks.replace.mockResolvedValue({ updatedPlayers: 2, updatedRewards: 1 });
});
afterEach(() => {
  wrapper?.unmount();
  vi.unstubAllGlobals();
});

async function open(optimize = true, preparePreview = true): Promise<void> {
  wrapper = mount(ReplacePortraitDialog, {
    props: { portraitId: 120, optimize },
    global: { stubs: { VDialog: dialog, PortraitDialogCard: card, VBtn: button, VAlert: card, VCheckbox: true, PortraitCleanupDialog: cleanup, PortraitCropEditor: editor } },
  });
  await wrapper.find("button").trigger("click");
  await flushPromises();
  if (optimize && preparePreview && wrapper.text().includes("Prepare WebP preview")) await save("Prepare WebP preview");
}
async function save(label = "Save optimized portrait and replace"): Promise<void> {
  const saveButton = wrapper.findAll("button").find((b) => b.text() === label);
  expect(saveButton).toBeDefined();
  await saveButton!.trigger("click");
  await flushPromises();
}

describe("portrait replacement workflow", () => {
  it("loads the original into an editable square crop without encoding until preparation", async () => {
    await open(true, false);
    const crop = wrapper.findComponent(editor);
    expect(crop.props("file")).toBe(await mocks.read.mock.results[0].value);
    expect(crop.props("initialFrame")).toBe(false);
    expect(mocks.optimize).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    await save("Prepare WebP preview");
    expect(mocks.optimize).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain("Original:");
    expect(mocks.upload).not.toHaveBeenCalled();
    await wrapper.findAll("button").find((b) => b.text() === "Adjust crop and frame")!.trigger("click");
    expect(wrapper.findComponent(editor).vm).toBe(crop.vm);
    await save("Prepare WebP preview");
    expect(mocks.optimize).toHaveBeenCalledTimes(2);
  });

  it("opens cleanup only after saving and the owner migration succeed", async () => {
    let finish!: (value: { updatedPlayers: number; updatedRewards: number }) => void;
    mocks.replace.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await open();
    expect(wrapper.text()).not.toContain("Cleanup prompt");
    await save();
    expect(mocks.replace).toHaveBeenCalledWith("token", 120, 121, true);
    expect(wrapper.text()).not.toContain("Cleanup prompt");
    finish({ updatedPlayers: 2, updatedRewards: 1 });
    await flushPromises();
    expect(wrapper.text()).toContain("Cleanup prompt");
    expect(mocks.addDefinition).toHaveBeenCalledWith({ ids: [121], groups: ["Supporters"] });
  });

  it("does not offer cleanup when migration fails", async () => {
    mocks.replace.mockRejectedValue(new Error("Migration unavailable"));
    await open();
    await save();
    expect(wrapper.text()).toContain("Migration unavailable");
    expect(wrapper.text()).not.toContain("Cleanup prompt");
  });

  it("continues saving and migrating owners when Alibaba upload fails", async () => {
    mocks.upload.mockImplementation((_token, _file, provider) => {
      if (provider === CloudStorageProvider.ALIBABA) return Promise.reject(new Error("Alibaba unavailable"));
      return Promise.resolve({ isSuccess: true });
    });
    await open();
    await save();
    expect(mocks.upload.mock.calls.map((call) => call[2])).toEqual([CloudStorageProvider.S3, CloudStorageProvider.ALIBABA]);
    expect(mocks.replace).toHaveBeenCalledWith("token", 120, 121, true);
    expect(wrapper.text()).toContain("Alibaba upload failed; continuing with S3.");
    expect(wrapper.text()).toContain("Cleanup prompt");
  });

  it("reuses the prepared image and ID after an interrupted migration", async () => {
    mocks.replace.mockRejectedValueOnce(new Error("Migration unavailable"));
    await open();
    await save();
    expect(wrapper.text()).not.toContain("Cleanup prompt");
    await save();
    expect(mocks.read).toHaveBeenCalledTimes(1);
    expect(mocks.optimize).toHaveBeenCalledTimes(1);
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.addDefinition).toHaveBeenCalledTimes(1);
    expect(mocks.replace.mock.calls).toEqual([["token", 120, 121, true], ["token", 120, 121, true]]);
    expect(wrapper.text()).toContain("Cleanup prompt");
  });

  it.each([true, false])("resumes an already recorded replacement without uploading another image (optimize=%s)", async (optimize) => {
    mocks.preview.mockResolvedValue({ owners: 2, selectedProfiles: 1, rewardDefinitions: 1, replacementPortraitId: 121 });
    await open(optimize);
    expect(wrapper.text()).not.toContain("Drag & drop a portrait image here");
    await save("Continue replacement");
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.optimize).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.addDefinition).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("token", 120, 121, true);
    expect(wrapper.text()).toContain("Cleanup prompt");
  });
});
