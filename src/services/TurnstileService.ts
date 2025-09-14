import { TURNSTILE_SITE_KEY } from "@/main";

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      isExpired: (widgetId: string) => boolean;
    };
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  appearance?: "always" | "execute" | "interaction-only";
  retry?: "auto" | "never";
  "retry-interval"?: number;
  "refresh-expired"?: "auto" | "manual" | "never";
  language?: string;
  action?: string;
}

export class TurnstileService {
  private static instance: TurnstileService;
  private scriptLoaded = false;
  private scriptLoading = false;
  private loadPromise: Promise<void> | null = null;
  private tokenCache = new Map<string, { token: string; expires: number }>();
  private readonly CACHE_DURATION = 4 * 60 * 1000; // 4 minutes (tokens are valid for 5 minutes)
  private readonly siteKey = TURNSTILE_SITE_KEY || "";

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): TurnstileService {
    if (!TurnstileService.instance) {
      TurnstileService.instance = new TurnstileService();
    }
    return TurnstileService.instance;
  }

  public isEnabled(): boolean {
    return !!this.siteKey;
  }

  public async loadScript(): Promise<void> {
    if (!this.isEnabled()) {
      console.warn("Turnstile is disabled (no site key configured)");
      return;
    }

    if (this.scriptLoaded) {
      return;
    }

    if (this.scriptLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.scriptLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.scriptLoaded = true;
        this.scriptLoading = false;
        resolve();
      };

      script.onerror = () => {
        this.scriptLoading = false;
        reject(new Error("Failed to load Turnstile script"));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  public async getToken(action?: string): Promise<string | null> {
    if (!this.isEnabled()) {
      console.debug("Turnstile is disabled, returning null token");
      return null;
    }

    // Check cache first
    const cacheKey = action || "default";
    const cached = this.tokenCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.token;
    }

    // Ensure script is loaded
    await this.loadScript();

    return new Promise((resolve) => {
      // Create a temporary container for the widget
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "50%";
      container.style.left = "50%";
      container.style.transform = "translate(-50%, -50%)";
      container.style.zIndex = "9999";
      container.style.backgroundColor = "white";
      container.style.padding = "20px";
      container.style.borderRadius = "8px";
      container.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      document.body.appendChild(container);

      // Add a backdrop
      const backdrop = document.createElement("div");
      backdrop.style.position = "fixed";
      backdrop.style.top = "0";
      backdrop.style.left = "0";
      backdrop.style.width = "100%";
      backdrop.style.height = "100%";
      backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      backdrop.style.zIndex = "9998";
      document.body.appendChild(backdrop);

      const cleanup = (widgetId?: string) => {
        if (widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        container.remove();
        backdrop.remove();
      };

      // Render the widget
      const widgetId = window.turnstile.render(container, {
        sitekey: this.siteKey,
        action,
        appearance: "always",
        theme: "auto",
        callback: (token: string) => {
          // Cache the token
          this.tokenCache.set(cacheKey, {
            token,
            expires: Date.now() + this.CACHE_DURATION,
          });
          cleanup(widgetId);
          resolve(token);
        },
        "error-callback": () => {
          cleanup(widgetId);
          resolve(null);
        },
        "expired-callback": () => {
          // Remove from cache if expired
          this.tokenCache.delete(cacheKey);
        },
      });
    });
  }

  public clearCache(): void {
    this.tokenCache.clear();
  }
}
