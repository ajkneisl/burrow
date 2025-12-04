import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// hi
console.log(`welcome to Burrow! version ${import.meta.env.VITE_VERSION}}`)

createRoot(document.getElementById("root")!).render(<App />)
