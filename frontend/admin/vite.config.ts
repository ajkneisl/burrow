import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
export default defineConfig({
    base: "/admin/",
    plugins: [
        tailwindcss(),
        tsconfigPaths(),
        react({
            babel: {
                plugins: [["babel-plugin-react-compiler"]]
            }
        })
    ]
})
