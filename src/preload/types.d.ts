export type PreloadApi = {
  nfc: any;
  options: {
    languages: {
      primary: string;
      secondary: string;
    };
    nfc: {
      readers: {
        challenge: RegExp;
        inventory: RegExp;
      };
    };
  };
};

declare global {
  interface Window {
    api: PreloadApi;
  }
}
