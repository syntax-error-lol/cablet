import { create } from "zustand";

import { FriendStore } from "./friendStore";

export const useFriend = create<FriendStore>((set, get) => ({
    friends: [],
    friendedBy: [],
    blocked: [],

    setFriends: (friends) => set({ friends }),
    setFriendedBy: (friendedBy) => set({ friendedBy }),
    setBlocked: (blocked) => set({ blocked }),

    isFriendsWith: (userId) => {
        const { friends, friendedBy } = get();

        return friends.some((f) => f.id === userId) && friendedBy.some((f) => f.id === userId);
    }
}));
