import { type Ref, watch } from "vue";

/**
 * Returns keyboard focus to the element that had it when a dialog opened.
 * Dialogs opened by `v-model` have no activator, so Vuetify has nothing to restore focus to.
 *
 * Bind the returned function to the dialog's `@after-leave`: by then the dialog's own focus
 * handling is done and the opener is reachable again. An opener that left the page meanwhile
 * is skipped.
 */
export function useRestoreFocus(open: Ref<boolean>): () => void {
  let opener: HTMLElement | null = null;

  // Sync, so the opener is read before the dialog's autofocus moves focus into it.
  watch(open, (isOpen) => {
    if (isOpen) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, { flush: "sync", immediate: true });

  return () => {
    const target = opener;
    opener = null;
    if (target !== null && target.isConnected) target.focus();
  };
}
