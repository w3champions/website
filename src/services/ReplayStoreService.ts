import { API_URL } from "@/config/env";
import { AuthorizedClient } from "@/services/http/AuthorizedClient";
import { ReplayExportApi } from "@/services/admin/ReplayExportService";
import { ReplayCheckout, ReplayExportFilter, ReplayOrder } from "@/store/admin/replayExport/types";

const client = new AuthorizedClient({ endpoint: API_URL });

/** The public replay store: the same search as the admin export; the buyer pays with Stripe before the download. */
export const replayStoreApi = new ReplayExportApi("api/replay-store", "purchases");

export default class ReplayStoreService {
  /** Saves the order and gives the Stripe payment page. The server sets the price. */
  public static async checkout(
    token: string,
    matchIds: string[],
    filter: ReplayExportFilter | null,
    label: string,
    description: string,
  ): Promise<ReplayCheckout> {
    return await client.requestJson("POST", `${replayStoreApi.base}/checkout`, token, { matchIds, filter, label, description });
  }

  /** The number of paid purchases of the user. */
  public static async countPurchases(token: string): Promise<number> {
    const { count } = await client.requestJson<{ count: number }>("GET", `${replayStoreApi.base}/purchases/count`, token);
    return count;
  }

  /** The order after the payment page: the server asks Stripe when the order is not paid yet. */
  public static async confirmOrder(token: string, orderId: string): Promise<ReplayOrder> {
    return await client.requestJson("POST", `${replayStoreApi.base}/orders/${encodeURIComponent(orderId)}/confirm`, token);
  }
}
