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
                <div>
                    <span className={styles.eyebrow}>STAFF CONTROL</span>
                    <h1>Owner dashboard</h1>
                    <p>Signed in as {user.username}. Your account has full local staff access.</p>
                </div>
                <div className={styles.ownerBadge}>
                    <i className="fas fa-crown" />
                    <span>OWNER</span>
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
                <h2>Catalog overview</h2>
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
                <h2>Quick access</h2>
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
