import { createRoot } from "react-dom/client"
import { createStore, Provider } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "./App.tsx"
import "./index.css"

const queryClient = new QueryClient()

export const store = createStore()

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <QueryClientProvider client={queryClient}>
            <div className="flex flex-row items-center justify-center">
                <App />
            </div>
        </QueryClientProvider>
    </Provider>
)
