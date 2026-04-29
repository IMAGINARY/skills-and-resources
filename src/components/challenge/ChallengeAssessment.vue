<script setup lang="ts">
import { toRef, toValue, type DeepReadonly, type MaybeRefOrGetter, computed } from "vue";
import LabeledPanel from "@/components/common/LabeledPanel.vue";
import {
  type CharacterData,
  type NonEmptySlotContent,
  type SlotContent,
} from "@/composables/use-character-data.ts";
import { useCharacterStore } from "@/stores/characters";
import { useConfigStore } from "@/stores/config";
import { useLanguageStore } from "@/stores/language";
import type { ChallengeConfig, ItemConfig, ChallengeItemConfig } from "@/types/config.ts";
import { useTap } from "@/composables/use-tap.ts";
import ItemSlotGroup from "@/components/common/ItemSlotGroup.vue";
import ItemSlot from "@/components/common/ItemSlot.vue";
import ItemInsideSlot from "@/components/common/ItemInsideSlot.vue";
import ColorizedMonochromeImage from "@/components/common/ColorizedMonochromeImage.vue";
import LanguageSelector from "@/components/common/LanguageSelector.vue";
import TooltipTransition from "@/components/common/TooltipTransition.vue";
import { DotLottieVue } from "@lottiefiles/dotlottie-vue";
import iconCorrectHref from "@/assets/icon-correct.svg?url";
import itemMissingHref from "@/assets/item-missing.svg?url";
import drawArrowLeftHref from "@/assets/draw-arrow-left.lottie?url";
import drawArrowUpperLeftHref from "@/assets/draw-arrow-upper-left.lottie?url";
import failureIconHref from "@/assets/failure-icon.svg?url";
import { INVENTORY_SIZE } from "@/constants.ts";
import { useTooltip } from "@/composables/use-tooltip.ts";

const props = defineProps<{
  challengeConfig: DeepReadonly<MaybeRefOrGetter<ChallengeConfig>>;
  characterData: DeepReadonly<MaybeRefOrGetter<CharacterData>>;
}>();

defineEmits<{ done: [] }>();

const { app, items, createInvalidItem } = useConfigStore();
const { useT } = useLanguageStore();
const t = useT();

const { hasItem } = useCharacterStore();

const challengeConfigRef = toRef(props.challengeConfig);
const characterDataRef = toRef(props.characterData);

const personalItemConfigs = computed(() =>
  characterDataRef.value.slotContents.immutable.map(
    ({ config }: { config: DeepReadonly<ItemConfig> }) => config,
  ),
);

const isNonEmptySlot = (sc: SlotContent): sc is NonEmptySlotContent =>
  sc.type === "item" || sc.type === "invalid";

const additionalItemConfigs = computed(() => {
  const filtered = characterDataRef.value.slotContents.mutable.filter(
    isNonEmptySlot,
  ) as NonEmptySlotContent[]; // TypeScript is too stupid to narrow down this type properly, so we have to typecast it :-/
  return filtered.map(({ config }) => config);
});

const requiredItemIds = computed<DeepReadonly<string[]>>(() =>
  toValue(challengeConfigRef).solution.items.map(({ id }) => id),
);
const personalItemIds = computed<DeepReadonly<string[]>>(() =>
  toValue(personalItemConfigs).map(({ id }) => id),
);
const additionalItemIds = computed<DeepReadonly<string[]>>(() =>
  toValue(additionalItemConfigs).map(({ id }) => id),
);
const characterItemIds = computed<DeepReadonly<string[]>>(() => [
  ...toValue(personalItemIds),
  ...toValue(additionalItemIds.value),
]);

const solvable = computed(() => {
  const requiredItemSet = new Set(toValue(requiredItemIds));
  const personalItemSet = new Set(toValue(personalItemIds));
  return requiredItemSet.difference(personalItemSet).size <= INVENTORY_SIZE - personalItemSet.size;
});

const solved = computed(() => {
  const requiredItemSet = new Set(toValue(requiredItemIds));
  const characterItemSet = new Set(toValue(characterItemIds));
  const remainingItemSet = requiredItemSet.difference(characterItemSet);
  return remainingItemSet.size === 0;
});

const iconCorrectUrl = new URL(iconCorrectHref);
const itemMissingUrl = new URL(itemMissingHref);
const failureIconUrl = new URL(failureIconHref);
</script>

<template>
  <div class="challenge-assessment app-position app-size">
    <div class="header"><img class="challenge-image" :src="challengeConfigRef.image.href" /></div>
    <div class="body">
      <div class="character-image">
        <img :src="characterDataRef.characterTypeConfig.croppedImage.href" />
      </div>
      <div class="challenge-info">
        <div class="title text-style-h2">{{ t(challengeConfigRef.title) }}</div>
        <div class="description text-style-copy">{{ t(challengeConfigRef.description) }}</div>
      </div>
      <div class="inventory">
        <LabeledPanel :label="t(app.challenge.inventory)">
          <div class="items">
            <div v-for="itemSubset in [personalItemConfigs, additionalItemConfigs]">
              <ItemSlotGroup>
                <div
                  v-for="{ item, isCorrect } in itemSubset.map((item) => ({
                    item,
                    isCorrect: challengeConfigRef.solution.items
                      .map(({ id }) => id)
                      .includes(item.id),
                  }))"
                  class="slot"
                >
                  <ItemSlot>
                    <template v-slot:badge v-if="isCorrect">
                      <ColorizedMonochromeImage :url="iconCorrectUrl" class="badge-icon">
                      </ColorizedMonochromeImage>
                    </template>
                    <ItemInsideSlot
                      :item="item"
                      :key="item.id"
                      :tooltip="
                        item.type === 'skill'
                          ? isCorrect
                            ? t(app.challenge.skillCorrectHint)
                            : t(app.challenge.skillIncorrectHint)
                          : isCorrect
                            ? t(app.challenge.resourceCorrectHint)
                            : t(app.challenge.resourceIncorrectHint)
                      "
                      class="item"
                      :class="[isCorrect ? 'correct' : 'incorrect']"
                    ></ItemInsideSlot
                  ></ItemSlot>
                </div>
              </ItemSlotGroup>
            </div>
          </div>
        </LabeledPanel>
      </div>
      <div class="challenge-items">
        <template
          v-for="{
            type,
            icon,
            present,
            missing,
            isPresent,
          } in challengeConfigRef.solution.items.map((item: ChallengeItemConfig) => ({
            type: items[item.id]?.type,
            icon: (items[item.id] ?? createInvalidItem(item.id)).icon,
            present: item.present,
            missing: item.missing,
            isPresent: hasItem(characterDataRef.characterId, item.id),
          }))"
        >
          <template v-for="{ showTooltip, toggleTooltip } in [useTooltip()]">
            <div
              v-drag="useTap(toggleTooltip)"
              class="challenge-item"
              :class="[isPresent ? 'present' : 'missing']"
            >
              <div class="container">
                <div class="icon-container">
                  <div class="icon">
                    <ColorizedMonochromeImage
                      :url="isPresent ? icon : itemMissingUrl"
                    ></ColorizedMonochromeImage>
                  </div>
                </div>
                <div class="text-style-card">
                  <TooltipTransition>
                    <div v-if="showTooltip.value">
                      {{
                        t(
                          typeof type !== "undefined"
                            ? type === "skill"
                              ? isPresent
                                ? app.challenge.skillPresentHint
                                : app.challenge.skillMissingHint
                              : isPresent
                                ? app.challenge.resourcePresentHint
                                : app.challenge.resourceMissingHint
                            : app.misc.invalidItem.description,
                        )
                      }}
                    </div>
                    <div v-else>{{ t(isPresent ? present : missing) }}</div>
                  </TooltipTransition>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
    <div class="footer">
      <div v-if="!solvable" class="footer-top">
        <div class="unsolvable-text-overline text-style-h3">
          {{ t(app.challenge.unsolvable.overline) }}
        </div>
        <div class="unsolvable-text-title white-space-pre-line text-style-h2">
          {{ t(app.challenge.unsolvable.title) }}
        </div>
        <div class="unsolvable-text-description white-space-pre-line text-style-card">
          {{ t(app.challenge.unsolvable.description) }}
        </div>
      </div>
      <div class="footer-bottom">
        <LanguageSelector :has-dark-background="true" class="language-selector"></LanguageSelector>
        <template v-if="solved">
          <div class="result">
            <div class="success text-style-h2-station-2">{{ t(app.challenge.success) }}</div>
            <button class="next-button text-style-tab" v-drag="useTap(() => $emit('done'))">
              <div>{{ t(app.challenge.next) }}</div>
            </button>
          </div>
          <div class="next-hint text-style-copy-bold">{{ t(app.challenge.nextHint) }}</div>
          <DotLottieVue class="next-arrow" autoplay loop :src="drawArrowUpperLeftHref" />
        </template>
        <template v-else>
          <div class="result">
            <div class="failure text-style-h2-station-2">{{ t(app.challenge.failure) }}</div>
            <ColorizedMonochromeImage :url="failureIconUrl" class="failure-icon">
            </ColorizedMonochromeImage>
          </div>
          <div class="retry-hint-container">
            <div><DotLottieVue class="retry-arrow" autoplay loop :src="drawArrowLeftHref" /></div>
            <div class="retry-hint text-style-copy-bold">{{ t(app.challenge.retryHint) }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.challenge-assessment {
  background-color: var(--color-backdrop-light);
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .header {
    height: 780px;

    .challenge-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .body {
    position: relative;
    flex: 1;
    margin: var(--app-padding) 50px;
    color: var(--color-primary);

    .character-image {
      position: absolute;
      top: calc(-1 * var(--app-padding));
      right: 0;
      width: 278px;
      height: 278px;
      transform: translate(0px, -50%);
      background-color: var(--color-white);
      border-radius: 50%;
      overflow: hidden;

      > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .label-with-idx {
      margin-bottom: 8px;
    }

    .title {
      text-box-trim: trim-start;
      text-box-edge: cap alphabetic;
      margin-bottom: 15px;
    }

    .description {
      width: 760px;
    }

    .inventory {
      position: absolute;
      top: calc(322px - var(--app-padding));
      left: 0;
      width: 100%;
      --border-color: var(--color-button);
      --label-background-color: var(--color-button);
      --label-color: var(--color-white);
      --label-image: url("@/assets/icon-inventory-locked.svg");

      .items {
        display: flex;
        justify-content: space-between;

        .slot {
          --badge-background-color: var(--color-button);
          --accent-color: var(--color-white);

          .badge-icon {
            width: 100%;
            height: 100%;
          }

          .item {
            &.correct {
              --accent-color: var(--color-primary);
              --label-color: var(--color-white);
              background-color: var(--color-button);
            }

            &.incorrect {
              --accent-color: var(--color-primary-inactive);
              --label-color: var(--color-primary-inactive);
              background-color: var(--color-card-inactive);
            }
          }
        }
      }
    }

    .challenge-items {
      position: absolute;
      top: 508px;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 130px;
      gap: 15px;

      .challenge-item {
        border-radius: 65px 16px 16px 65px;
        padding: 20px 36px 20px 20px;

        .container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 22px;

          .icon-container {
            flex-shrink: 0;
            height: 100%;
            width: auto;
            aspect-ratio: 1 / 1;
            border-radius: 50%;
            overflow: hidden;
            padding: 10px;
          }
        }

        &.present {
          color: var(--color-primary);
          border: 2px solid var(--color-button);
          background-color: var(--color-white);

          .icon-container {
            background-color: var(--color-button);
            --accent-color: var(--color-primary);
            .icon {
              width: 100%;
              height: 100%;
            }
          }
        }

        &.missing {
          color: var(--color-white);
          background-color: var(--color-secondary);

          .icon-container {
            background-color: var(--color-secondary-inactive);
            --accent-color: var(--color-secondary);
            display: flex;
            align-items: center;
            justify-content: center;

            > * {
              margin-bottom: -4px;
            }
          }
        }
      }
    }

    .challenge-unsolvable {
      position: absolute;
      top: 508px;
      width: 100%;
      background-color: var(--color-backdrop-dark);
    }
  }

  .footer {
    position: relative;
    border-width: 0 var(--app-padding) var(--app-padding) var(--app-padding);
    border-style: solid;
    border-color: transparent;
    background-color: var(--color-backdrop-dark);

    .footer-top {
      height: calc(575px - 254px);
      padding: var(--app-padding) 0 0 0;
      text-align: center;

      .unsolvable-text-overline {
        color: var(--color-white);
        margin-bottom: 21px;
      }

      .unsolvable-text-title {
        color: var(--color-secondary);
        margin-bottom: 16px;
      }

      .unsolvable-text-description {
        color: var(--color-white);
      }
    }

    .footer-bottom {
      height: calc(254px - var(--app-padding));

      .language-selector {
        position: absolute;
        bottom: 0;
        left: 0;
        margin-bottom: -14px;
      }

      .result {
        position: absolute;
        bottom: 74px;
        left: 0;
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
        width: 100%;
      }

      .success,
      .failure {
        margin-bottom: calc(-1 * var(--text-style-h2-station-2-descender));
        flex-shrink: 0;
      }

      .success {
        color: var(--color-button);
      }

      .next-button {
        text-box-trim: trim-both;
        text-box-edge: cap alphabetic;
        border-radius: 30px;
        border-width: 0;
        width: 476px;
        height: 60px;
        background-color: var(--color-button);
        color: var(--color-white);

        > * {
          vertical-align: middle;
        }
      }

      .next-arrow {
        position: absolute;
        bottom: 0;
        right: -43px;
        width: 117px;
        transform: translate(0, calc(50% + 5px)) rotate(90deg) scaleY(-1);
      }

      .failure {
        color: var(--color-secondary);
      }

      .retry-arrow {
        height: 61px;
        transform: rotate(6.794deg);
        margin-bottom: -25px;
      }

      .failure-icon {
        width: 82px;
        margin-bottom: -7px;
        --accent-color: var(--color-secondary);
      }

      .retry-hint-container {
        position: absolute;
        bottom: 0;
        right: 0;
        display: flex;
        flex-direction: row;
        align-items: flex-end;
      }

      .next-hint {
        position: absolute;
        bottom: 0;
        right: 75px;
        text-align: right;
      }

      .retry-hint-container {
        gap: 19px;
      }

      .next-hint,
      .retry-hint {
        text-box-trim: trim-both;
        text-box-edge: cap alphabetic;
      }
    }
  }
}
</style>
