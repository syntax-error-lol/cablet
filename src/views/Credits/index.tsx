import { useEffect, useState } from "react";
import { useCachedUser } from "@stores/CachedUserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { CreditContainer, CreditModal } from "./components";
import styles from "./credits.module.scss";

import { CreditUser, Credit } from "./credits.d";

export default function Credits() {
    const [users, setUsers] = useState<CreditUser[]>([]);

    const { addCachedUser } = useCachedUser();
    const { createModal } = useModal();

    const credits: Credit[] = [
        { user: "syntax", description: "Project direction, engineering, and the Blacket rewrite." }
    ];

    useEffect(() => {
        Promise.all(credits.map(async (credit) => {
            const user = await addCachedUser(credit.user);

            return { ...credit, user };
        })).then((users) => setUsers(users));
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.intro}>
                <span className={styles.eyebrow}>BLACKET REWRITE</span>
                <h1>Credits</h1>
                <p>Built with care by the people who keep showing up, testing things, and making the world more fun.</p>
            </div>
            {users.length > 0 && users.map((credit, index) => credit.user && <CreditContainer
                key={index}
                credit={credit}
                onClick={() => createModal(<CreditModal credit={credit} />)}
            />)}
            <div className={styles.communityCredit}>Community testers, artists, and bug reporters<br /><strong>Thank you for helping us build.</strong></div>
        </div>
    );
}
