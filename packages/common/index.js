const withoutBlocked = ({ friends = [], friendedBy = [], blocked = [] }) => {
    const blockedIds = new Set(blocked.map((user) => user.id));
    return [...friends, ...friendedBy].filter((user) => !blockedIds.has(user.id));
};

export const isFriendsWith = (userId, lists) => lists.friends.some((user) => user.id === userId);
export const isBlocking = (userId, lists) => lists.blocked.some((user) => user.id === userId);
export const getFriendRequests = (lists) => lists.friendedBy.filter((user) => !lists.friends.some((friend) => friend.id === user.id));
export const getSendingRequests = (lists) => lists.friends.filter((user) => !lists.friendedBy.some((friend) => friend.id === user.id));
export const getAllFriends = (lists) => withoutBlocked(lists);