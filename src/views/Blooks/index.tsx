import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { ItemContainer, PageHeader, SearchBox } from "@components/index";
import styles from "./blooks.module.scss";

export default function Blooks() {
    const { user } = useUser();
    const [search, setSearch] = useState("");

    if (!user) return <Navigate to="/login" />;

    return (
        <>
            {window.innerWidth > 768 && <PageHeader>Inventory</PageHeader>}
            <main className={styles.page}>
                <SearchBox
                    noPadding={true}
                    placeholder="Search for a blook..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <div className={styles.grid}>
                    <ItemContainer
                        user={user}
                        options={{
                            showBlooks: true,
                            showShiny: true,
                            showLocked: false,
                            showPacks: false,
                            searchQuery: search
                        }}
                    />
                </div>
            </main>
        </>
    );
}