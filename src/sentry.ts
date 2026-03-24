import { type App } from "vue";
import { type Pinia } from "pinia";
import * as Sentry from "@sentry/vue";
import type {
  BrowserClientProfilingOptions,
  BrowserClientReplayOptions,
  Options,
} from "@sentry/core";

const sentryConsoleIngegration = Sentry.captureConsoleIntegration({
  // array of methods that should be captured
  // defaults to ['log', 'info', 'warn', 'error', 'debug', 'assert']
  levels: ["error"],
});
type MySentryOptions = Options & BrowserClientReplayOptions & BrowserClientProfilingOptions;
const initialSentryOptions: MySentryOptions = {
  release: process.env.GIT_COMMIT_HASH || "unknown",
  transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
  transportOptions: {},
  // Filter out default `Vue` integration
  integrations: (integrations) => [
    ...integrations.filter((integration) => integration.name !== "Vue"),
    sentryConsoleIngegration,
  ],
  // Disable traces, replays and profiling
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  profileSessionSampleRate: 0,
  profileLifecycle: "manual",
};

export function initSentry(dsn: string) {
  // early init ignoring vue
  Sentry.init({ ...initialSentryOptions, dsn });
}

export function addSentryVue(app: App, pinia: Pinia) {
  // add Vue integration
  Sentry.addIntegration(Sentry.vueIntegration({ app }));

  // add Pinia plugin
  pinia.use(Sentry.createSentryPiniaPlugin());
}
