import { createRoot } from "react-dom/client"
import "./api.config.ts"
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(<App />)
