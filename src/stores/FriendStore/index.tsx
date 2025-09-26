import { create } from "zustand";

import {
    isFriendsWith as isFriendsWithCommon,
    isBlocking as isBlockingCommon,
    getFriendRequests,
    getSendingRequests
} from "@blacket/common";
import { FriendStore } from "./friendStore.d";

export const useFriend = create<FriendStore>((set, get) => ({
    friends: [],
    friendedBy: [],
    blocked: [],

    setFriends: (friends) => set({ friends }),
    setFriendedBy: (friendedBy) => set({ friendedBy }),
    setBlocked: (blocked) => set({ blocked }),

    isFriendsWith: (userId) => {
        const { friends, friendedBy } = get();

        return isFriendsWithCommon(userId, { friends, friendedBy, blocked: [] });
    },
    isBlocking: (userId) => {
        const { blocked } = get();

        return isBlockingCommon(userId, { friends: [], friendedBy: [], blocked });
    },

    get friendRequests() {
        const { friends, friendedBy } = get();

        return getFriendRequests({ friends, friendedBy, blocked: [] });
    },
    get sendingRequests() {
        const { friends, friendedBy } = get();

        return getSendingRequests({ friends, friendedBy, blocked: [] });
    },

    isRequesting: (userId) => {
        const { friends, friendedBy } = get();

        return getSendingRequests({ friends, friendedBy, blocked: [] }).some((u) => u.id === userId);
    },

    isRequestedBy: (userId) => {
        const { friends, friendedBy } = get();

        return getFriendRequests({ friends, friendedBy, blocked: [] }).some((u) => u.id === userId);
    }
}));
