import { ref, onMounted, onUnmounted, readonly, computed } from "vue";

import type { Ref, DeepReadonly } from "vue";
import type { TokenStateNFC, TokenReaderMessage } from "@renderer/types/token";

import { TokenStateType } from "@renderer/types/token";

// Default WebSocket server URL
const WS_URL = "ws://localhost:8382";

// Shared WebSocket connection and state
let ws: WebSocket | null = null;
let connectionPromise: Promise<void> | null = null;
const state = ref<TokenReaderMessage>({
  inventory: { state: TokenStateType.ABSENT },
  challenge: { state: TokenStateType.ABSENT },
});
const inventoryState = computed(() => state.value.inventory);
const challengeState = computed(() => state.value.challenge);
const connectionState = ref<"connecting" | "connected" | "disconnected" | "error">("disconnected");
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let subscriberCount = 0;

function connect(): Promise<void> {
  if (connectionPromise) return connectionPromise;
  if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve();

  connectionPromise = new Promise((resolve, reject) => {
    connectionState.value = "connecting";
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      connectionState.value = "connected";
      console.log("Token reader WebSocket connected");
      connectionPromise = null;
      resolve();
    };

    ws.onmessage = (event) => {
      try {
        state.value = JSON.parse(event.data) as TokenReaderMessage; // TODO: Validate instead of typecasting
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      connectionState.value = "disconnected";
      ws = null;
      connectionPromise = null;
      console.log("Token reader WebSocket disconnected");

      // Reset states to absent on disconnect
      state.value = {
        inventory: { state: TokenStateType.ABSENT },
        challenge: { state: TokenStateType.ABSENT },
      };

      // Attempt reconnect if there are still subscribers
      if (subscriberCount > 0 && !reconnectTimeout) {
        reconnectTimeout = setTimeout(() => {
          reconnectTimeout = null;
          connect().catch(console.error);
        }, 2000);
      }
    };

    ws.onerror = (err) => {
      connectionState.value = "error";
      console.error("Token reader WebSocket error:", err);
      connectionPromise = null;
      reject(err);
    };
  });

  return connectionPromise;
}

function disconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  connectionPromise = null;
}

function subscribe(): void {
  subscriberCount++;
  if (subscriberCount === 1) {
    connect().catch(console.error);
  }
}

function unsubscribe(): void {
  subscriberCount--;
  if (subscriberCount <= 0) {
    subscriberCount = 0;
    disconnect();
  }
}

type TokenStateReturn = {
  tokenState: DeepReadonly<Ref<TokenStateNFC>>;
  connectionState: DeepReadonly<Ref<"connecting" | "connected" | "disconnected" | "error">>;
};

function useTokenState(which: "inventory" | "challenge"): TokenStateReturn {
  onMounted(subscribe);
  onUnmounted(unsubscribe);

  const stateRef = which === "inventory" ? inventoryState : challengeState;

  return {
    tokenState: readonly(stateRef),
    connectionState: readonly(connectionState),
  };
}

export const useInventoryTokenState = (): TokenStateReturn => useTokenState("inventory");
export const useChallengeTokenState = (): TokenStateReturn => useTokenState("challenge");
