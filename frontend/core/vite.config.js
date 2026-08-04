import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import dts from "vite-plugin-dts";
// Two entry points: the default one ships the React components, `api` ships
// the platform-agnostic API layer so React Native can consume it without
// pulling in any DOM-only dependency.
export default defineConfig({
    build: {
        // Hermes is the lowest common denominator across the three clients
        target: "es2020",
        lib: {
            entry: {
                index: resolve(__dirname, "./lib/index.ts"),
                api: resolve(__dirname, "./lib/api/index.ts"),
            },
            name: "burrow-core",
            formats: ["es", "cjs"],
            fileName: (format, entryName) => format === "es" ? `${entryName}.es.js` : `${entryName}.cjs`,
        },
        rollupOptions: {
            external: ["react", "react-dom", "tailwindcss"],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    tailwindcss: "tailwindcss",
                },
            },
        },
        sourcemap: true,
        emptyOutDir: true,
    },
    plugins: [react(), dts({ rollupTypes: true })],
});
