/**
 * Simple event bus for React Native to replace window.addEventListener/dispatchEvent.
 * Provides cross-platform event handling for sync events.
 */

type EventListener = (event: any) => void

class EventBus {
    private listeners: Map<string, Set<EventListener>> = new Map()

    addEventListener(eventName: string, listener: EventListener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set())
        }
        this.listeners.get(eventName)!.add(listener)
    }

    removeEventListener(eventName: string, listener: EventListener) {
        const eventListeners = this.listeners.get(eventName)
        if (eventListeners) {
            eventListeners.delete(listener)
        }
    }

    dispatchEvent(event: any) {
        const eventName = event.type
        const eventListeners = this.listeners.get(eventName)
        if (eventListeners) {
            eventListeners.forEach((listener) => {
                listener(event)
            })
        }
    }
}

// Global event bus instance
export const eventBus = new EventBus()
