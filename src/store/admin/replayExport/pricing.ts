import { ReplayExportPrices } from "./types";

export interface ReplayExportQuote {
  replays: number;
  /** Replays × the price per replay. */
  subtotal: number;
  /** What the download costs: the subtotal, but at least the minimum price. */
  total: number;
  /** True when the subtotal is less than the minimum price, so the minimum price is the total. */
  minimumApplies: boolean;
}

/** The same rule as website-backend `ReplayExportPricing.Price`. No replays cost nothing. */
export function quoteReplays(replays: number, prices: ReplayExportPrices): ReplayExportQuote {
  if (replays <= 0) return { replays: 0, subtotal: 0, total: 0, minimumApplies: false };
  const subtotal = Math.round(replays * prices.pricePerReplay * 100) / 100;
  return { replays, subtotal, total: Math.max(subtotal, prices.minimumPrice), minimumApplies: subtotal < prices.minimumPrice };
}

/** "$1,234.50" */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/** How the total is made: "1,000 × $0.02", or "200 × $0.02 = $4.00 · $5.00 minimum". */
export function quoteDetail(quote: ReplayExportQuote, prices: ReplayExportPrices): string {
  if (quote.replays === 0) return "No replays selected";
  const perReplay = `${quote.replays.toLocaleString("en-US")} × ${formatPrice(prices.pricePerReplay, prices.currency)}`;
  if (!quote.minimumApplies) return perReplay;
  return `${perReplay} = ${formatPrice(quote.subtotal, prices.currency)} · ${formatPrice(prices.minimumPrice, prices.currency)} minimum`;
}
