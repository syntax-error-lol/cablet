import { Navigate, Link } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { PermissionTypeEnum } from "@blacket/types";
import styles from "./staff.module.scss";

export default function StaffTools({ title, message }: { title: string; message: string }) {
    const { user } = useUser();

    if (!user || !user.hasPermission(PermissionTypeEnum.VIEW_AUDIT)) return <Navigate to="/login" replace />;

    return (
        <section className={styles.section}>
            <h2>{title}</h2>
            <p>{message}</p>
            <Link className={styles.actions} to="/staff">Back to staff panel</Link>
        </section>
    );
}
