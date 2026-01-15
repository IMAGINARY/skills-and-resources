export type PreloadApi = {
  nfc: any;
};

declare global {
  interface Window {
    api: PreloadApi;
  }
}
