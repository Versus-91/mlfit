// webworker.js

// Setup your project to serve `py-worker.js`. You should also serve
// `pyodide.js`, and all its associated `.asm.js`, `.json`,
// and `.wasm` files as well:
// eslint-disable-next-line no-undef
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

async function loadPyodideAndPackages() {
    // eslint-disable-next-line no-undef
    self.pyodide = await loadPyodide();
    await self.pyodide.loadPackage(["micropip", "scipy", "matplotlib", "pandas"]);
    const micropip = self.pyodide.pyimport("micropip");
    await micropip.install('seaborn');
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
    // make sure loading is done
    await pyodideReadyPromise;
    // Don't bother yet with this line, suppose our API is built in such a way:
    const { id, python, ...context } = event.data;
    // The worker copies the context in its own "memory" (an object mapping name to values)
    for (const key of Object.keys(context)) {
        self[key] = context[key];
    }
    // Now is the easy part, the one that is similar to working in the main thread:
    try {
        await self.pyodide.loadPackagesFromImports(python);
        let results = await self.pyodide.runPythonAsync(python);
        const result = results.toJs()
        self.postMessage({ results: result, id });
    } catch (error) {
        self.postMessage({ error: error.message, id });
    }
};