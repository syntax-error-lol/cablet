import { Fragment, useEffect, useState } from "react";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { useLoading } from "@stores/LoadingStore/index";
import { useModal } from "@stores/ModalStore";
import { useUser } from "@stores/UserStore/index";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useAuctionHouse } from "@stores/AuctionHouseStore/index";
import { useFriend } from "@stores/FriendStore/index";
import { useUsers } from "@controllers/users/useUsers/index";
import { useSearchAuction } from "@controllers/auctions/useSearchAuction/index";
import { useClaimDailyTokens } from "@controllers/quests/useClaimDailyTokens/index";
import { useAddFriend } from "@controllers/friends/useAddFriend/index";
import { useRemoveFriend } from "@controllers/friends/useRemoveFriend/index";
import { useRevokeRequest } from "@controllers/friends/useRevokeRequest/index";
import { useDeclineRequest } from "@controllers/friends/useDeclineRequest/index";
import { Auction, Blook, ImageOrVideo, Username, InventoryBlook, InventoryItem, ItemContainer, Title, Button, Modal } from "@components/index";
import { LevelContainer, LookupUserModal, SmallButton, SectionHeader, StatContainer, CosmeticsModal, DailyRewardsModal, StatButton } from "./components";
import styles from "./dashboard.module.scss";

import { AuctionsAuctionEntity, PrivateUser, PublicUser } from "@blacket/types";
import { CosmeticsModalCategory, FriendsViewMode } from "./dashboard.d";

export default function Dashboard() {
    const { setLoading } = useLoading();
    const { createModal } = useModal();
    const { user, getUserAvatarPath, getUserBannerPath, getBlookAmount, isAvatarBig } = useUser();
    const { cachedUsers, addCachedUserWithData } = useCachedUser();
    const { blooks, packs, items, titleIdToText } = useData();
    const { resourceIdToPath } = useResource();
    const { setSearch } = useAuctionHouse();
    const { getAllFriends, getFriendRequests, getSendingRequests, isFriendsWith, isRequesting, isRequestedBy, friends, friendedBy, blocked } = useFriend();

    if (!user) return <Navigate to="/login" />;

    const { getUser } = useUsers();
    const { searchAuction } = useSearchAuction();
    const { claimDailyTokens } = useClaimDailyTokens();

    const { addFriend } = useAddFriend();
    const { removeFriend } = useRemoveFriend();
    const { revokeRequest } = useRevokeRequest();
    const { declineRequest } = useDeclineRequest();

    const [searchParams] = useSearchParams();

    const navigate = useNavigate();

    const [viewingUser, setViewingUser] = useState<PublicUser | PrivateUser>(user);
    const [viewingUserAuctions, setViewingUserAuctions] = useState<AuctionsAuctionEntity[]>([]);
    const [inventoryLoaded, setInventoryLoaded] = useState<boolean>(false);

    const [allFriends, setAllFriends] = useState<PublicUser[]>([]);
    const [friendRequests, setFriendRequests] = useState<PublicUser[]>([]);
    const [sendingRequests, setSendingRequests] = useState<PublicUser[]>([]);
    const [friendsViewMode, setFriendsViewMode] = useState<FriendsViewMode>(FriendsViewMode.ALL);

    const renderFriends = (friends: PublicUser[]) => {
        return friends.map((friend) => (
            <div
                className={styles.friend}
                key={friend.id}
                onClick={() => {
                    viewUser(friend.username)
                        .catch(() => { });
                }}
            >
                <div className={styles.friendAvatarContainer}>
                    <Blook
                        className={styles.friendAvatar}
                        src={getUserAvatarPath(friend)}
                        alt="Friend Avatar"
                        draggable={false}
                        custom={friend.customAvatar ? true : false}
                        shiny={friend.avatar?.shiny}
                        data-big={isAvatarBig(friend)}
                    />
                </div>
                <div className={styles.friendBannerAndInfo}>
                    <div className={styles.friendBanner}>
                        <img
                            src={getUserBannerPath(friend)}
                            alt="Friend Banner"
                            draggable={false}
                        />
                    </div>
                    <Username className={styles.friendUsername} user={friend} />
                    <Title title={friend.titleId} className={styles.friendTitle} />
                </div>
            </div>
        ));
    };

    const viewUser = (username: string) => new Promise<void>((resolve, reject) => {
        const cachedUser = cachedUsers.find((user) => user.username.toLowerCase() === username.toLowerCase() || user.id === username);

        if (cachedUser) {
            if (cachedUser.id !== user.id) {
                setViewingUser(cachedUser);

                navigate(`/dashboard?name=${cachedUser.username}`);
            } else {
                setViewingUser(user);

                navigate("/dashboard");
            }

            resolve();
        } else getUser(username)
            .then((res) => {
                if (res.data.id !== user.id) {
                    setViewingUser(res.data);

                    addCachedUserWithData(res.data);

                    navigate(`/dashboard?name=${res.data.username}`);
                } else {
                    setViewingUser(user);

                    navigate("/dashboard");
                }

                resolve();
            })
            .catch((err) => reject(err));
    });

    // viewing user
    useEffect(() => {
        if (!searchParams.get("name")) return;

        setLoading(true);

        viewUser(searchParams.get("name")!)
            .catch(() => {
                setViewingUser(user);

                navigate("/dashboard");
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setInventoryLoaded(false);

        if (!viewingUser) return;
        if (searchParams.get("name") && viewingUser.id === user.id) return;

        searchAuction({ seller: viewingUser.id })
            .then((res) => setViewingUserAuctions(res.data))
            .catch(() => setViewingUserAuctions([]));
    }, [viewingUser]);

    useEffect(() => {
        if (searchParams.get("name")) return;
        if (viewingUser.id !== user.id) return;

        setViewingUser(user);
    }, [user]);

    // friends
    useEffect(() => {
        setAllFriends(getAllFriends());
    }, [user, getAllFriends, friends, friendedBy, blocked]);

    useEffect(() => {
        setFriendRequests(getFriendRequests());
    }, [user, getFriendRequests, friends, friendedBy, blocked]);

    useEffect(() => {
        setSendingRequests(getSendingRequests());
    }, [user, getSendingRequests, friends, friendedBy, blocked]);

    const claimableDate = new Date();
    claimableDate.setUTCHours(0, 0, 0, 0);

    return (
        <div className={styles.parentHolder}>
            <div className={`${styles.section} ${styles.userSection}`}>
                <div className={styles.userTopProfile}>
                    <div className={styles.userBannerBlook}>
                        <div
                            className={styles.userAvatarContainer}
                            data-hoverable={viewingUser.id === user.id}
                        >
                            <Blook
                                className={styles.userAvatar}
                                src={getUserAvatarPath(viewingUser)}
                                alt="User Avatar"
                                draggable={false}
                                custom={viewingUser.customAvatar ? true : false}
                                shiny={viewingUser.avatar?.shiny}
                                big={isAvatarBig(viewingUser)}
                                onClick={() => {
                                    if (viewingUser.id === user.id) createModal(<CosmeticsModal category={CosmeticsModalCategory.AVATAR} />);
                                }}
                            />
                        </div>
                        <div className={styles.bannerLevel}>
                            <div
                                className={styles.userBanner}
                                data-hoverable={viewingUser.id === user.id}
                                onClick={() => {
                                    if (viewingUser.id === user.id) createModal(<CosmeticsModal category={CosmeticsModalCategory.BANNER} />);
                                }}
                            >
                                <img
                                    src={getUserBannerPath(viewingUser)}
                                    alt="User Banner"
                                    draggable={false}
                                />
                                <div className={styles.userInfoContainer}>
                                    <div className={styles.usernameAndTitleContainer}>
                                        <Username className={styles.username} user={viewingUser} />
                                        <Title title={viewingUser.titleId} className={styles.title} />
                                    </div>
                                </div>
                            </div>

                            <LevelContainer experience={viewingUser.experience} />
                        </div>
                    </div>

                    <div className={styles.statButtonContainer}>
                        <StatButton
                            icon="fas fa-user-plus"
                            onClick={() => createModal(<LookupUserModal onClick={viewUser} />)}
                        >
                            Lookup User
                        </StatButton>

                        {viewingUser.id === user.id && new Date(user.lastClaimed) < claimableDate && <StatButton icon="fas fa-star" onClick={() => {
                            setLoading(true);

                            claimDailyTokens()
                                .then((res) => createModal(<DailyRewardsModal amount={res.data.tokens} />))
                                .finally(() => setLoading(false));
                        }}>Daily Rewards</StatButton>}


                        <StatButton icon="fas fa-cart-shopping" onClick={() => {
                            navigate("/store");
                        }}>Store</StatButton>

                        {viewingUser.id !== user.id && <>
                            {
                                !isFriendsWith(viewingUser.id) && !isRequesting(viewingUser.id) && !isRequestedBy(viewingUser.id)
                                && <StatButton icon="fas fa-user-plus" onClick={() => {
                                    setLoading(true);

                                    addFriend(viewingUser.id)
                                        .catch((err) => createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>))
                                        .finally(() => setLoading(false));
                                }}>Add Friend</StatButton>
                            }

                            {isFriendsWith(viewingUser.id)
                                && <StatButton icon="fas fa-user-xmark" onClick={() => {
                                    setLoading(true);

                                    removeFriend(viewingUser.id)
                                        .catch((err) => createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>))
                                        .finally(() => setLoading(false));
                                }}>Remove Friend</StatButton>
                            }

                            {isRequesting(viewingUser.id) && <StatButton icon="fas fa-user-xmark" onClick={() => {
                                setLoading(true);

                                revokeRequest(viewingUser.id)
                                    .catch((err) => createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>))
                                    .finally(() => setLoading(false));
                            }}>Revoke Request</StatButton>}

                            {isRequestedBy(viewingUser.id) && <>
                                <StatButton icon="fas fa-user-plus" onClick={() => {
                                    setLoading(true);

                                    addFriend(viewingUser.id)
                                        .catch((err) => createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>))
                                        .finally(() => setLoading(false));
                                }}>Accept Request</StatButton>

                                <StatButton icon="fas fa-user-xmark" onClick={() => {
                                    setLoading(true);

                                    declineRequest(viewingUser.id)
                                        .catch((err) => createModal(<Modal.ErrorModal>{err?.data?.message || "Something went wrong."}</Modal.ErrorModal>))
                                        .finally(() => setLoading(false));
                                }}>Decline Request</StatButton>
                            </>}
                        </>}

                        {viewingUser.id !== user.id && <StatButton icon="fas fa-reply" onClick={() => {
                            setViewingUser(user);

                            navigate("/dashboard");
                        }}>Go Back</StatButton>}
                    </div>

                    <div className={styles.userBadges}>
                        {viewingUser.badges.sort((a, b) => a.priority - b.priority).map((badge) => badge.imageId && <div className={styles.badgeContainer} key={badge.id}>
                            <ImageOrVideo src={resourceIdToPath(badge.imageId)} alt={badge.name} />
                        </div>)}
                    </div>

                    {viewingUser.discord && <div className={styles.discordContainer}>
                        <div className={styles.discordAvatarContainer}>
                            <img
                                src={`https://cdn.discordapp.com/avatars/${viewingUser.discord.discordId}/${viewingUser.discord.avatar}.webp`}
                                onError={(e) => e.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/0.png"}
                                draggable={false}
                            />
                            <i className="fab fa-discord" />
                        </div>
                        <span>{viewingUser.discord.username}</span>
                    </div>}
                </div>

            </div>

            <div className={`${styles.section} ${styles.statsSection}`}>
                <div className={styles.statsContainer} style={{
                    backgroundColor: "unset",
                    boxShadow: "unset"
                }}>
                    <div className={styles.statsContainerHolder}>
                        <StatContainer title="User ID" icon={window.constructCDNUrl("/content/icons/dashboardStatsUserID.png")} value={viewingUser.id} />
                        {viewingUser.guild && <StatContainer title="Guild" icon={window.constructCDNUrl("/content/icons/dashboardStatsGuild.png")} value={viewingUser.guild ? viewingUser.guild : "None"} />}
                        <StatContainer title="Total Blooks" icon={window.constructCDNUrl("/content/icons/dashboardStatsBlooksUnlocked.png")} value={`${viewingUser.blooks.length.toLocaleString()}`} />
                        <StatContainer title="Tokens" icon={window.constructCDNUrl("/content/token.png")} value={viewingUser.tokens.toLocaleString()} />
                        <StatContainer title="Diamonds" icon={window.constructCDNUrl("/content/diamond.png")} value={viewingUser.diamonds.toLocaleString()} />
                        <StatContainer title="Crystals" icon={window.constructCDNUrl("/content/crystal.png")} value={viewingUser.crystals.toLocaleString()} />
                        <StatContainer title="Packs Opened" icon={window.constructCDNUrl("/content/icons/dashboardStatsPacksOpened.png")} value={viewingUser.statistics.packsOpened.toLocaleString()} />
                        <StatContainer title="Messages Sent" icon={window.constructCDNUrl("/content/icons/dashboardStatsMessagesSent.png")} value={viewingUser.statistics.messagesSent.toLocaleString()} />
                    </div>
                </div>
            </div>

            <div className={`${styles.section} ${styles.friendsSection}`}>
                <div className={styles.friendsContainer}>
                    <div className={styles.friendsTop}>
                        <p className={styles.friendsHeader}>
                            Friends
                        </p>

                        <p className={styles.friendsMode}>
                            {friendsViewMode === FriendsViewMode.ALL
                                ? "All Friends"
                                : friendsViewMode === FriendsViewMode.REQUESTS
                                    ? "Incoming Requests"
                                    : "Outgoing Requests"
                            }
                        </p>

                        <div className={styles.friendsViewModeButtons}>
                            {friendsViewMode !== FriendsViewMode.REQUESTS && <StatButton
                                icon="fas fa-arrow-up"
                                onClick={() => setFriendsViewMode(FriendsViewMode.REQUESTS)}
                            >
                                Incoming

                                <div className={styles.requestCount} style={{ display: friendRequests.length > 0 ? "flex" : "none" }}><div>{friendRequests.length}</div></div>
                            </StatButton>}

                            {friendsViewMode !== FriendsViewMode.SENDING && <StatButton
                                icon="fas fa-arrow-down"
                                onClick={() => setFriendsViewMode(FriendsViewMode.SENDING)}
                            >
                                Outgoing
                            </StatButton>}

                            {friendsViewMode !== FriendsViewMode.ALL && <StatButton
                                icon="fas fa-user"
                                onClick={() => setFriendsViewMode(FriendsViewMode.ALL)}
                            >
                                All
                            </StatButton>}
                        </div>
                    </div>

                    <div className={styles.holdFriends}>
                        {(friendsViewMode === FriendsViewMode.ALL && allFriends.length === 0) && <>You don't have any friends. Why don't you make some?</>}

                        {friendsViewMode === FriendsViewMode.ALL && renderFriends(allFriends)}
                        {friendsViewMode === FriendsViewMode.REQUESTS && renderFriends(friendRequests)}
                        {friendsViewMode === FriendsViewMode.SENDING && renderFriends(sendingRequests)}
                    </div>
                </div>
            </div>

            <div className={`${styles.section} ${styles.auctionSection}`}>
                <SectionHeader>Auctions</SectionHeader>

                <div className={styles.statsContainer}>
                    <div className={styles.userAuctions}>
                        {viewingUserAuctions.length > 0 ? viewingUserAuctions.map((auction) => <Auction key={auction.id} auction={auction} useVhStyles={true} onClick={() => {
                            setSearch({ seller: viewingUser.username });

                            navigate("/auction-house");
                        }} />) : <div className={styles.noAuctions}>
                            <img src={window.constructCDNUrl("/content/404.png")} />
                            No auctions found.
                        </div>}
                    </div>
                </div>
            </div>

            <div className={`${styles.section} ${styles.inventorySection}`}>
                <SectionHeader>Inventory</SectionHeader>

                <div className={styles.statsContainer}>
                    <div className={styles.inventoryItemsContainer}>
                        {inventoryLoaded && <ItemContainer
                            user={viewingUser}
                            options={{
                                showBlooks: true,
                                showShiny: true,
                                showLocked: false,
                                showPacks: false,
                                showItems: true
                            }}
                            className={styles.inventoryItems}
                            onClick={() => {
                                navigate(`/inventory?name=${viewingUser.username}`);
                            }}
                        />}
                        {!inventoryLoaded && <Button.GenericButton onClick={() => setInventoryLoaded(true)}>
                            Load Inventory
                        </Button.GenericButton>}
                    </div>
                </div>
            </div>
        </div>
    );
}
