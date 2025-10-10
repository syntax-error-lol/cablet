import { RefObject } from "react";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { ContextMenuStore, ContextMenu } from "./contextMenu.d";

// Debounce utility to prevent excessive updates
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
}

// Throttle utility for mouse move events
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }) as T;
}

export const useContextMenu = create<ContextMenuStore>()(
    subscribeWithSelector((set, get) => {
        const contextMenuRef = { current: null } as RefObject<HTMLDivElement>;

        const setContextMenu = (contextMenu: ContextMenu) => set({ contextMenu });

        const openContextMenu = (items: ContextMenu["items"]) => {
            // Early return for empty items
            if (!items || items.length === 0) return;

            if (window.innerWidth <= 768) {
                set({
                    visible: true,
                    contextMenu: { items }
                });
                return;
            }

            const cursor = get().cursorPosition || { x: 0, y: 0 };

            // Set initial position immediately
            setContextMenu({ items, x: cursor.x, y: cursor.y });
            set({ visible: true });

            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                if (!contextMenuRef.current) return;

                const rect = contextMenuRef.current.getBoundingClientRect();
                const x = Math.min(cursor.x, window.innerWidth - rect.width - 10);
                const y = Math.min(cursor.y, window.innerHeight - rect.height - 10);

                // Only update if position actually changed
                const currentMenu = get().contextMenu;
                if (currentMenu && (currentMenu.x !== x || currentMenu.y !== y)) {
                    setContextMenu({ items, x, y });
                }
            });
        };

        const closeContextMenu = () => {
            set({ visible: false });
            // Delay clearing contextMenu to allow for animations
            setTimeout(() => set({ contextMenu: null }), 150);
        };

        const setVisible = (v: boolean) => set({ visible: v });

        return {
            contextMenu: null,
            setContextMenu,
            openContextMenu,
            closeContextMenu,
            visible: false,
            setVisible,
            contextMenuRef,
            cursorPosition: { x: 0, y: 0 }
        };
    })
);

// Optimized event listeners with proper cleanup
let isListenersSetup = false;

if (typeof window !== "undefined" && !isListenersSetup) {
    const store = useContextMenu;

    // Throttle mouse move to prevent excessive updates
    const throttledMouseMove = throttle((e: MouseEvent) => {
        // Only update if context menu is visible or might be opened soon
        const state = store.getState();
        if (state.visible || Date.now() - lastMouseDown < 1000) {
            store.setState({ cursorPosition: { x: e.clientX, y: e.clientY } });
        }
    }, 16); // ~60fps

    let lastMouseDown = 0;

    const handleMouseDown = (e: MouseEvent) => {
        lastMouseDown = Date.now();
        const state = store.getState();

        if (state.visible && state.contextMenuRef?.current) {
            if (!state.contextMenuRef.current.contains(e.target as Node)) {
                state.closeContextMenu();
            }
        }
    };

    // Debounced context menu close on window events
    const debouncedClose = debounce(() => {
        const state = store.getState();
        if (state.visible) {
            state.closeContextMenu();
        }
    }, 100);

    const handleScroll = () => debouncedClose();
    const handleResize = () => debouncedClose();

    // Add event listeners
    window.addEventListener("mousemove", throttledMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    // Handle escape key
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const state = store.getState();
            if (state.visible) {
                state.closeContextMenu();
            }
        }
    });

    isListenersSetup = true;
}
