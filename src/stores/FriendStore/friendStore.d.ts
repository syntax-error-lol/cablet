import { FriendsFriendsEntity, PublicUser } from "@blacket/types";

export interface FriendStore extends FriendsFriendsEntity {
    setFriends: (friends: PublicUser[]) => void;
    setFriendedBy: (friendedBy: PublicUser[]) => void;
    setBlocked: (blocked: PublicUser[]) => void;

    isFriendsWith: (userId: string) => boolean;
    isRequesting: (userId: string) => boolean;
}
