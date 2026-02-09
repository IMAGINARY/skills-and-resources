const shutdownController = new AbortController();

const shutdown = () => {
  process.off("SIGINT", shutdown);
  process.off("SIGTERM", shutdown);
  shutdownController.abort();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const appShutdownSignal = shutdownController.signal;
const appShutdownPromise = new Promise<void>((resolve) => {
  if (appShutdownSignal.aborted) return resolve();
  appShutdownSignal.addEventListener("abort", () => resolve(), { once: true });
});

export { shutdown, appShutdownSignal, appShutdownPromise };
