import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { GenericButton } from "@components/Buttons";
import styles from "./staff.module.scss";

import { PermissionTypeEnum } from "@blacket/types";

export default function StaffPanel() {
    const { user } = useUser();
    const { blooks, items, packs, banners, badges } = useData();
    const { resources } = useResource();
    if (!user || !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT)) return <Navigate to="/login" />;

    return (
        <div className={styles.panelContainer}>
            <section className={styles.hero}>
                <div className={styles.crest}>
                    <i className="fas fa-wrench" />
                </div>
                <div>
                    <span className={styles.eyebrow}>STAFF CONTROL</span>
                    <h1>Owner dashboard</h1>
                    <p>Signed in as {user.username}. Your account has full local staff access.</p>
                </div>
                <div className={styles.ownerBadge}>
                    <i className="fas fa-crown" />
                    <span>{user.isOwner ? "OWNER" : "STAFF"}</span>
                </div>
            </section>

            <section className={styles.statsGrid}>
                {[
                    ["fas fa-shield-halved", "Permissions", user.permissions.length],
                    ["fas fa-paw", "Blooks", blooks.length],
                    ["fas fa-box-open", "Packs", packs.length],
                    ["fas fa-database", "Resources", resources.length]
                ].map(([icon, label, value]) => (
                    <div className={styles.stat} key={label as string}>
                        <i className={icon as string} />
                        <strong>{value as number}</strong>
                        <span>{label as string}</span>
                    </div>
                ))}
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeading}>
                    <div>
                        <span className={styles.eyebrow}>YOUR TOOLKIT</span>
                        <h2>Staff command deck</h2>
                    </div>
                    <i className="fas fa-bolt" />
                </div>
                <div className={styles.commandGrid}>
                    {[
                        ["/staff/users", "fas fa-user-gear", "User manager", "Edit profiles, currency, badges, and experience.", PermissionTypeEnum.MANAGE_USERS],
                        ["/staff/reports", "fas fa-flag", "Report manager", "Review player reports waiting for attention.", PermissionTypeEnum.MANAGE_REPORTS],
                        ["/dashboard", "fas fa-chart-line", "Player dashboard", "Check the live player-facing experience.", PermissionTypeEnum.VIEW_AUDIT],
                        ["/map-editor", "fas fa-map", "Map editor", "Jump into the world layout and build tools.", PermissionTypeEnum.VIEW_AUDIT]
                    ].map(([to, icon, title, description, permission]) => {
                        const available = user.hasPermission(permission as PermissionTypeEnum);
                        return <GenericButton
                            key={title as string}
                            to={available ? to as string : undefined}
                            icon={icon as string}
                            className={`${styles.command} ${!available ? styles.locked : ""}`}
                            aria-disabled={!available}
                            onClick={!available ? (event) => event.preventDefault() : undefined}
                        >
                            <span><strong>{title as string}</strong><small>{description as string}</small></span>
                            <i className={`fas ${available ? "fa-arrow-right" : "fa-lock"}`} />
                        </GenericButton>;
                    })}
                </div>
            </section>

            <section className={styles.accessSection}>
                <div className={styles.accessCopy}>
                    <span className={styles.eyebrow}>ACCESS PASS</span>
                    <h2>Permission loadout</h2>
                    <p>Active permissions assigned to {user.username}.</p>
                </div>
                <div className={styles.permissionList}>
                    {user.permissions.map((permission) => <span className={styles.permission} key={permission}>{permission.replaceAll("_", " ")}</span>)}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeading}>
                    <div>
                        <span className={styles.eyebrow}>LIVE CATALOG</span>
                        <h2>Catalog overview</h2>
                    </div>
                    <strong className={styles.total}>{blooks.length + items.length + packs.length + banners.length + badges.length} records</strong>
                </div>
                <div className={styles.catalogGrid}>
                    {[["Blooks", blooks.length], ["Items", items.length], ["Packs", packs.length], ["Banners", banners.length], ["Badges", badges.length]].map(([label, value]) => (
                        <div className={styles.catalogRow} key={label as string}>
                            <span>{label as string}</span>
                            <strong>{value as number}</strong>
                        </div>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeading}>
                    <div>
                        <span className={styles.eyebrow}>JUMP BACK IN</span>
                        <h2>Quick access</h2>
                    </div>
                </div>
                <div className={styles.actions}>
                    <GenericButton to="/dashboard" icon="fas fa-users">Users</GenericButton>
                    <GenericButton to="/market" icon="fas fa-store">Market</GenericButton>
                    <GenericButton to="/inventory" icon="fas fa-box">Inventory</GenericButton>
                    <GenericButton to="/map-editor" icon="fas fa-map">Map editor</GenericButton>
                </div>
            </section>
        </div>
    );
}
