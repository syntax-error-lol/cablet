import { Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { PermissionTypeEnum } from "@blacket/types";
import styles from "./staff.module.scss";

export default function StaffTools({ title, message, endpoint }: { title: string; message: string; endpoint: string }) {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (!user || !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT)) return;

        window.fetch2.get(endpoint).then((response: any) => {
            setItems(Array.isArray(response.data) ? response.data : []);
        }).catch(() => setItems([]));
    }, [endpoint]);

    if (!user || !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT)) return <Navigate to="/login" replace />;

    return (
        <section className={styles.section}>
            <h2>{title}</h2>
            <p>{message}</p>
            <div className={styles.catalogGrid}>
                {items.length === 0 ? <div className={styles.catalogRow}><span>No records found</span></div> : items.map((item) => (
                    <div className={styles.catalogRow} key={item.id}>
                        <span>{item.username || item.title || `Record ${item.id}`}</span>
                        <strong>{item.role || item.status || "Open"}</strong>
                    </div>
                ))}
            </div>
            <Link className={styles.actions} to="/staff">Back to staff panel</Link>
        </section>
    );
}
