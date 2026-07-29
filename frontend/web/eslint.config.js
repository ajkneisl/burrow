import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { globalIgnores } from "eslint/config"
import tailwind from "eslint-plugin-tailwindcss"

export default tseslint.config([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat["recommended-latest"],
            reactRefresh.configs.vite,
            tailwind.configs.recommended
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser
        },
        settings: {
            // v4 reads the theme from the CSS entrypoint; it defaults to src/style.css
            tailwindcss: { cssConfigPath: "src/index.css" }
        },
        rules: {
            "tailwindcss/no-custom-classname": "off",

            // react-hooks v7 ships React Compiler readiness rules as errors. This app
            // doesn't run the compiler (see vite.config.ts — admin does, web doesn't),
            // so surface them as warnings until the flagged effects are reworked.
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/purity": "warn",
            "react-hooks/immutability": "warn",
            "react-hooks/preserve-manual-memoization": "warn"
        }
    }
])
