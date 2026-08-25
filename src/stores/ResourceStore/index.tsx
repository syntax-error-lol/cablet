import { create } from "zustand";

import { ResourceStore } from "./resourceStore.d";

export const useResource = create<ResourceStore>((set, get) => ({
    resources: [],

    setResources: (resources) => set({ resources }),

    resourceIdToPath: (id) => {
        const resource = get().resources.find((r) => r.id === id);

        if (!resource) return window.errorImage;
        if (/^https?:\/\//.test(resource.path)) return resource.path;

        return resource.path.replace("{cdn}", window.constructCDNUrl(""));
    }
}));