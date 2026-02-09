import { defineStore } from "pinia";
import { computed } from "vue";
import { useWebSocket } from "@vueuse/core";
import { Value } from "typebox/value";

import { TokenStateType } from "@renderer/types/token";
import { MAX_WEBSOCKET_RETRY_DELAY } from "@renderer/constants";
import { useOptionsStore } from "@renderer/stores/options";
import { TokenReaderMessageSchema } from "@renderer/types/token";

import type { DeepReadonly } from "vue";

import type { TokenReaderMessage } from "@renderer/types/token";

export const useTokenStore = defineStore("token", () => {
  const { options } = useOptionsStore();
  const { websocketTokenReaderUrl } = options;

  const { data } = useWebSocket<string>(websocketTokenReaderUrl, {
    onConnected: () => console.log("Connected!"),
    onDisconnected: (_ws, event) => console.log("Disconnected!", event.code),
    onError: (_ws, event) => console.error("Error:", event),
    autoReconnect: {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, ..., (MAX_RETRY_DELAY / 1000)s
      delay: (retries) => {
        const delay = Math.min(1000 * 2 ** (retries - 1), MAX_WEBSOCKET_RETRY_DELAY);
        console.info(`Attempting retry No. ${retries} in ${Math.round(delay / 100) / 10}s`);
        return delay;
      },
    },
  });

  const initialState: DeepReadonly<TokenReaderMessage> = {
    inventory: { state: TokenStateType.ABSENT },
    challenge: { state: TokenStateType.ABSENT },
  };
  const tokenState = computed<TokenReaderMessage>(() => {
    try {
      if (data.value === null)
        // nothing received yet
        return initialState;

      try {
        const jsonData = JSON.parse(data.value);
        try {
          return Value.Parse(TokenReaderMessageSchema, jsonData);
        } catch (parseError) {
          console.log("Failed to parse WebSocket message", parseError);
        }
      } catch (jsonParseError) {
        console.log("Failed to parse WebSocket message as JSON object", jsonParseError);
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
    return initialState;
  });
  const inventory = computed(() => tokenState.value.inventory);
  const challenge = computed(() => tokenState.value.challenge);

  return { inventory, challenge };
});

export type { TokenReaderMessage };
