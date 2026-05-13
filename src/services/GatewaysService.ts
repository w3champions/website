import { Gateways } from "@/store/ranking/types";

const gatewayLocalStorageKey = "w3c-gateway";

export default class GatewaysService {
  public static getGateway(): Gateways {
    const gatewayString = localStorage.getItem(gatewayLocalStorageKey);

    if (gatewayString) {
      return Number(gatewayString);
    }

    return Gateways.Europe;
  }

  public static setGateway(gateway: Gateways): void {
    localStorage.setItem(gatewayLocalStorageKey, gateway.toString());
  }
}
