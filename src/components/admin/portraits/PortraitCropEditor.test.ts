// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import PortraitCropEditor from "./PortraitCropEditor.vue";

const encoder = vi.hoisted(() => vi.fn());
vi.mock("@/services/StillPortraitService", () => ({ exportStillPortrait: encoder }));
let wrapper: VueWrapper;
afterEach(() => {
  wrapper?.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  encoder.mockReset();
});

it.each([[2500, 2505, false], [2505, 2500, false], [2500, 2505, undefined]] as const)("optimizes a %i × %i original on a square canvas and allows reframing", async (width, height, initialFrame) => {
  const images: object[] = [];
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = width;
      naturalHeight = height;
      onload: (() => void) | null = null;
      set src(_value: string) {
        images.push(this);
        queueMicrotask(() => this.onload?.());
      }
    },
  );
  vi.stubGlobal("URL", Object.assign(class extends URL {}, { createObjectURL: () => "blob:original", revokeObjectURL: vi.fn() }));
  const context = { fillRect: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const output = new File(["encoded"], "portrait.webp", { type: "image/webp" });
  encoder.mockResolvedValue(output);
  wrapper = mount(PortraitCropEditor, {
    props: { file: new File(["jpeg"], "SPECIAL_120.jpg"), disabled: false, initialFrame },
    global: { stubs: { VCard: { template: "<div><slot /></div>" }, VBtn: { template: "<button><slot /></button>" }, VSlider: true, VAlert: true, VCheckbox: true } },
  });
  await flushPromises();
  expect(encoder).not.toHaveBeenCalled();
  expect(context.drawImage).toHaveBeenCalledWith(images[0], (width - 2500) / 2, (height - 2500) / 2, 2500, 2500, 0, 0, 256, 256);
  if (initialFrame === false) expect(context.drawImage.mock.calls.every((call) => call[0] === images[0])).toBe(true);
  else expect(context.drawImage).toHaveBeenLastCalledWith(images[1], 0, 0, 256, 256);
  const prepared = wrapper.emitted("prepared")!.at(-1)![0] as () => Promise<File>;
  expect(await prepared()).toBe(output);
  expect(encoder).toHaveBeenCalledWith(wrapper.find("canvas").element);
  if (initialFrame === false) context.drawImage.mockClear();
  if (initialFrame === false) await wrapper.findAll("button").find((button) => button.text() === "Standard frame: Off")!.trigger("click");
  else await wrapper.find("v-slider-stub").trigger("dblclick");
  expect(context.drawImage).toHaveBeenLastCalledWith(images[1], 0, 0, 256, 256);
  const percentage = wrapper.find("input[aria-label='Zoom percentage']");
  await percentage.setValue("150");
  expect(context.drawImage.mock.calls.at(-2)![3]).toBeCloseTo(2500 / 1.5);
  await percentage.setValue("500");
  expect((percentage.element as HTMLInputElement).value).toBe("400");
  await percentage.setValue("20");
  expect((percentage.element as HTMLInputElement).value).toBe("90.625");
  await percentage.setValue("");
  expect((percentage.element as HTMLInputElement).value).toBe("90.625");
  await wrapper.find("v-slider-stub").trigger("dblclick");
  expect((percentage.element as HTMLInputElement).value).toBe("100");
  expect(encoder).toHaveBeenCalledOnce();
});
