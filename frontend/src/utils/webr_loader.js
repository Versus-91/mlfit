var webr = null;

export const loadWebR = async () => {
  if (!webr) {

    webr = await import('https://webr.r-wasm.org/v0.4.3/webr.mjs');
  }
  return webr
}
