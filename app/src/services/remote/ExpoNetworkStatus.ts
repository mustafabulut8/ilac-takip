import * as Network from 'expo-network';

import type { NetworkStatus } from '../ConsentService';

type NetworkState = { isConnected?: boolean; isInternetReachable?: boolean };

/** Telefon internete erişebiliyor mu? iOS'ta `isInternetReachable`, `isConnected`'a eşittir. */
function isOnline(state: NetworkState) {
  return state.isConnected === true && state.isInternetReachable !== false;
}

/** expo-network üzerine Adapter. */
export class ExpoNetworkStatus implements NetworkStatus {
  async isOnline() {
    return isOnline(await Network.getNetworkStateAsync());
  }

  /** İnternet geri gelince haber verir (kuyruk o an gönderilir). */
  onReconnect(listener: () => void) {
    let wasOnline = true;
    const subscription = Network.addNetworkStateListener((state) => {
      const online = isOnline(state);
      if (online && !wasOnline) listener();
      wasOnline = online;
    });
    return () => subscription.remove();
  }
}
