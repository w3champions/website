/**
 * Shared SSO / sign-in constants used across the login flow participants
 * (App.vue, Login.vue, SsoContinue.vue, AdminReplayChatLogMessages.vue).
 * Keep these values byte-identical to the historical string literals so the
 * sessionStorage key and CustomEvent name stay compatible across the app.
 */

/** sessionStorage key holding the post-login return path. */
export const LOGIN_RETURN_TO_KEY = "w3-login-return-to";

/** CustomEvent name that asks App.vue to open the sign-in dialog. */
export const OPEN_SIGN_IN_DIALOG_EVENT = "w3-open-sign-in-dialog";
