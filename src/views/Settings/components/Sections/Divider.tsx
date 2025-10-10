import styles from "../../settings.module.scss";

import { DividerProps } from "../../settings.d";

export default function Divider({ margin }: DividerProps) {
    return <div className={styles.settingsContainerDivider} style={{ margin: `${margin}px 0` }} />;
}
