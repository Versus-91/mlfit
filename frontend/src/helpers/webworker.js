// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.json`,
// and `.wasm` files as well:
// eslint-disable-next-line no-undef
importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.1/full/pyodide.js");

async function loadPyodideAndPackages() {
  // eslint-disable-next-line no-undef
  self.pyodide = await loadPyodide();
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
  await pyodideReadyPromise;
  const { id, python, ...context } = event.data;
  for (const key of Object.keys(context)) {
    self[key] = context[key];
  }
  try {
    await self.pyodide.loadPackage(["numpy", "matplotlib", "pandas"], { messageCallback: () => { }, errorCallback: () => { } });
    await self.pyodide.loadPackagesFromImports(python, { messageCallback: () => { }, errorCallback: () => { } });

    let results = await self.pyodide.runPythonAsync(python);
    const result = results.toJs()
    results.destroy()
    self.postMessage({ results: result, id });
  } catch (error) {
    self.postMessage({ error: error.message, id });
  }
};