// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { nextTick, ref } from "vue";
import { useRestoreFocus } from "./useRestoreFocus";

afterEach(() => {
  document.body.innerHTML = "";
});

function addButton(): HTMLButtonElement {
  const button = document.createElement("button");
  document.body.appendChild(button);
  return button;
}

test("focus returns to the element that had it when the dialog opened", async () => {
  const opener = addButton();
  const inside = addButton();
  opener.focus();
  const open = ref(false);
  const restore = useRestoreFocus(open);

  open.value = true;
  await nextTick();
  inside.focus();
  open.value = false;
  restore();

  expect(document.activeElement).toBe(opener);
});

test("an opener that left the page is skipped", async () => {
  const opener = addButton();
  const inside = addButton();
  opener.focus();
  const open = ref(false);
  const restore = useRestoreFocus(open);
  open.value = true;
  await nextTick();
  inside.focus();
  opener.remove();

  restore();

  expect(document.activeElement).toBe(inside);
});
