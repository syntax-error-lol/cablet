import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { PermissionTypeEnum } from "@blacket/types";
import styles from "./staff.module.scss";

export default function StaffTools({ title, message, endpoint }: { title: string; message: string; endpoint: string }) {
    const { user } = useUser();
    const { badges: catalogBadges } = useData();
    const { resourceIdToPath } = useResource();
    const canManageUsers = user?.hasPermission(PermissionTypeEnum.MANAGE_USERS) || false;
    const [items, setItems] = useState<any[]>([]);
    const [editing, setEditing] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [color, setColor] = useState("#ffffff");
    const [badges, setBadges] = useState("");
    const [tokens, setTokens] = useState(0);
    const [diamonds, setDiamonds] = useState(0);
    const [experience, setExperience] = useState(0);

    useEffect(() => {
        if (!user || (endpoint === "/api/staff/users" ? !canManageUsers : !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT))) return;

        window.fetch2.get(endpoint).then((response: any) => {
            setItems(Array.isArray(response.data) ? response.data : []);
        }).catch(() => setItems([]));
    }, [canManageUsers, endpoint, user]);

    if (!user || (endpoint === "/api/staff/users" ? !canManageUsers : !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT))) return <Navigate to="/login" replace />;

    return (
        <section className={styles.section}>
            <h2>{title}</h2>
            <p>{message}</p>
            <div className={styles.catalogGrid}>
                {items.length === 0 ? <div className={styles.catalogRow}><span>No records found</span></div> : items.map((item) => (
                    <div className={styles.catalogRow} key={item.id}>
                        <span>{item.username || item.title || `Record ${item.id}`}</span>
                        <strong>{item.role || item.status || "Open"}</strong>
                        {endpoint === "/api/staff/users" && <>
                            <button className={styles.actions} onClick={() => {
                                setEditing(item.id);
                                setUsername(item.username || "");
                                setAvatarUrl(item.avatarUrl || "");
                                setColor(item.color || "#ffffff");
                                setBadges((item.badges || []).map((badge: any) => badge.id).join(","));
                                setTokens(item.tokens || 0);
                                setDiamonds(item.diamonds || 0);
                                setExperience(item.experience || 0);
                            }}>Edit profile</button>
                            {editing === item.id && <div className={styles.editor}>
                                <strong>Editing {item.username}</strong>
                                <div className={styles.profilePreview}>
                                    <img className={styles.profilePreviewBanner} src={item.bannerId ? resourceIdToPath(item.bannerId) : window.constructCDNUrl("/content/banners/Default.png")} alt="Profile banner preview" />
                                    <div className={styles.profilePreviewBody}>
                                        <img className={styles.profilePreviewAvatar} src={avatarUrl || window.constructCDNUrl("/content/blooks/Default.png")} alt="Profile avatar preview" />
                                        <div>
                                            <strong style={{ color }}>{username || "Username"}</strong>
                                            <div className={styles.profilePreviewBadges}>
                                                {catalogBadges.filter((badge: any) => badges.split(",").map(Number).includes(badge.id)).map((badge: any) => <img key={badge.id} src={resourceIdToPath(badge.imageId)} alt={badge.name} title={badge.name} />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input value={username} onChange={(event) => setUsername(event.target.value)} aria-label="Username" placeholder="Username" />
                                <input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} aria-label="Custom profile picture URL" placeholder="Custom PFP URL" />
                                <input value={color} onChange={(event) => setColor(event.target.value)} aria-label="Name color" />
                                <div className={styles.badgePicker}>
                                    {catalogBadges.map((badge: any) => {
                                        const selected = badges.split(",").map(Number).includes(badge.id);
                                        return <button type="button" className={selected ? styles.selectedBadge : ""} key={badge.id} onClick={() => setBadges(selected ? badges.split(",").filter((id) => Number(id) !== badge.id).join(",") : `${badges}${badges ? "," : ""}${badge.id}`)}>
                                            <img src={resourceIdToPath(badge.imageId)} alt={badge.name} />{badge.name}
                                        </button>;
                                    })}
                                </div>
                                <input type="number" min="0" value={tokens} onChange={(event) => setTokens(Number(event.target.value))} aria-label="Tokens" />
                                <input type="number" min="0" value={diamonds} onChange={(event) => setDiamonds(Number(event.target.value))} aria-label="Diamonds" />
                                <input type="number" min="0" value={experience} onChange={(event) => setExperience(Number(event.target.value))} aria-label="Experience" />
                                <button className={styles.actions} onClick={() => window.fetch2.patch(`/api/staff/users/${item.id}`, {
                                    username,
                                    avatarUrl,
                                    color,
                                    badges: badges.split(",").map((value) => Number(value.trim())).filter(Boolean),
                                    tokens,
                                    diamonds,
                                    experience
                                }).then((response: any) => setItems((current) => current.map((entry) => entry.id === item.id ? response.data : entry))).finally(() => setEditing(null))}>Save</button>
                            </div>}
                        </>}
                    </div>
                ))}
            </div>
            <Link className={styles.actions} to="/staff">Back to staff panel</Link>
        </section>
    );
}
