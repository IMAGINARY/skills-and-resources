export async function preloadAsset(url: URL) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onerror = () => {
      console.error(`Failed to load asset: ${url.href}`);
      reject();
    };
    img.onload = () => {
      resolve(img);
    };
    img.src = url.href;
  });
}

export async function preloadAssets(urls: URL[]) {
  Promise.all(urls.map(preloadAsset)).catch(() =>
    console.error("Some assets could not be loaded. See console for details."),
  );
}
