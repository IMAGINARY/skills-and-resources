import React, { useState, useCallback, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import SelectInput from "ink-select-input";
import { Emitter } from "@mnasyrov/pubsub";
import { shutdown } from "./shutdown-signal.ts";
import { TokenStateType } from "./token-reader.ts";
import { createInitialState, serveWebSocket } from "./state-server.ts";

import type { Publisher } from "@mnasyrov/pubsub";
import type { TokenStateNFC } from "./token-reader-nfc";
import type { ReaderRole, StateMessage } from "./state-server.ts";

export interface Character {
  uuid: string;
  name: string;
}

export interface SimulateConfig {
  host: string;
  port: number;
  characters: Character[];
}

interface CharacterItem {
  label: string;
  value: Character;
}

interface SimulatorProps {
  characters: Character[];
  onStateChange: (state: StateMessage) => void;
}

function formatCharacterDisplay(character: Character | null): string {
  if (character === null) return "(none)";
  return `${character.name} [${character.uuid}]`;
}

function Simulator({ characters, onStateChange }: SimulatorProps) {
  const { exit } = useApp();
  const [activeReader, setActiveReader] = useState<ReaderRole>("inventory");
  const [inventoryCharacter, setInventoryCharacter] = useState<Character | null>(null);
  const [challengeCharacter, setChallengeCharacter] = useState<Character | null>(null);

  const items: CharacterItem[] = characters.map((c) => ({
    label: `${c.name} [${c.uuid}]`,
    value: c,
  }));

  const createTokenState = useCallback((character: Character | null): TokenStateNFC => {
    if (character === null) {
      return { state: TokenStateType.ABSENT };
    }
    return {
      state: TokenStateType.PRESENT,
      token: { id: character.uuid, class: character.name },
    };
  }, []);

  useEffect(() => {
    const state: StateMessage = {
      inventory: createTokenState(inventoryCharacter),
      challenge: createTokenState(challengeCharacter),
    };
    onStateChange(state);
  }, [inventoryCharacter, challengeCharacter, createTokenState, onStateChange]);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      shutdown();
    }
    if (key.leftArrow || key.rightArrow || input === "h" || input === "l") {
      setActiveReader((prev) => (prev === "inventory" ? "challenge" : "inventory"));
    }
    if (key.backspace || key.delete) {
      if (activeReader === "inventory") {
        setInventoryCharacter(null);
      } else {
        setChallengeCharacter(null);
      }
    }
  });

  const handleSelect = (item: CharacterItem) => {
    if (activeReader === "inventory") {
      setInventoryCharacter(item.value);
    } else {
      setChallengeCharacter(item.value);
    }
  };

  const getSelectedIndex = (character: Character | null): number => {
    if (character === null) return 0;
    return items.findIndex((item) => item.value.uuid === character.uuid);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Token Reader Simulator
      </Text>
      <Text dimColor>─────────────────────────────────────────────────────</Text>
      <Box marginTop={1}>
        <Box flexDirection="column" marginRight={4} width={40}>
          <Text bold color={activeReader === "inventory" ? "green" : "white"}>
            {activeReader === "inventory" ? "▶ " : "  "}Inventory
          </Text>
          <Text dimColor>
            {formatCharacterDisplay(inventoryCharacter)}
          </Text>
        </Box>
        <Box flexDirection="column" width={40}>
          <Text bold color={activeReader === "challenge" ? "green" : "white"}>
            {activeReader === "challenge" ? "▶ " : "  "}Challenge
          </Text>
          <Text dimColor>
            {formatCharacterDisplay(challengeCharacter)}
          </Text>
        </Box>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>
          Select character for {activeReader}:
        </Text>
        <SelectInput
          items={items}
          initialIndex={getSelectedIndex(activeReader === "inventory" ? inventoryCharacter : challengeCharacter)}
          onSelect={handleSelect}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          ← → switch reader | ↑ ↓ select | Enter confirm | Backspace remove | q quit
        </Text>
      </Box>
    </Box>
  );
}

function createSimulatorPublisher(
  characters: Character[],
): { publisher: Publisher<StateMessage>; waitUntilExit: () => Promise<void> } {
  const emitter = new Emitter<StateMessage>();
  const publisher: Publisher<StateMessage> = emitter;

  let lastState: StateMessage = createInitialState();

  const handleStateChange = (state: StateMessage) => {
    lastState = state;
    emitter.emit(structuredClone(lastState));
  };

  console.log(`Characters: ${characters.map((c) => `${c.name} [${c.uuid}]`).join(", ")}`);

  const { waitUntilExit } = render(
    <Simulator characters={characters} onStateChange={handleStateChange} />
  );

  return { publisher, waitUntilExit };
}

export async function simulate(config: SimulateConfig): Promise<number> {
  const { host, port, characters } = config;

  if (characters.length === 0) {
    console.error("Error: At least one character must be provided");
    return 1;
  }

  const { publisher, waitUntilExit } = createSimulatorPublisher(characters);

  // Start WebSocket server in background, trigger shutdown when TUI exits
  const serverPromise = serveWebSocket({ host, port }, publisher);

  // Wait for TUI to exit, then trigger shutdown
  await waitUntilExit();
  shutdown();

  return await serverPromise;
}
