// pyodide-worker.js

// Load Pyodide from CDN
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

let pyodide = null;

async function loadPyodideAndPackages() {
    try {
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
        });

        // Load micropip for package management
        await pyodide.loadPackage("micropip");

        // Redirect stdout/stderr to main thread
        pyodide.setStdout({
            batched: (msg) => {
                self.postMessage({ type: 'stdout', content: msg });
            }
        });
        pyodide.setStderr({
            batched: (msg) => {
                self.postMessage({ type: 'stderr', content: msg });
            }
        });

        // Notify readiness
        self.postMessage({ type: 'ready' });
    } catch (e) {
        self.postMessage({ type: 'error', content: "Failed to load Pyodide: " + e.message });
    }
}

let pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event) => {
    // Wait for pyodide to be ready
    await pyodideReadyPromise;

    const { type, code, files, packages } = event.data;

    if (type === 'run') {
        try {
            // Install packages if requested
            if (packages && Array.isArray(packages) && packages.length > 0) {
                const micropip = pyodide.pyimport("micropip");
                await micropip.install(packages);
            }

            // Mount files to virtual filesystem
            if (files && Array.isArray(files)) {
                for (const file of files) {
                    pyodide.FS.writeFile(file.name, file.content);
                }
            }

            // Run the code
            await pyodide.runPythonAsync(code);
            self.postMessage({ type: 'done' });
        } catch (error) {
            self.postMessage({ type: 'error', content: error.message });
        }
    }
};
