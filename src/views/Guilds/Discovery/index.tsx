import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import styles from "../guilds.module.scss";

type Guild = { id: string; name: string; ownerId: string; level: number; experience: number; memberCount: number; requests: string[]; members: string[] };

export default function GuildDiscovery() {
    const { user, setUser } = useUser();
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState<any[]>([]);
    const [chatText, setChatText] = useState("");
    const active = user?.guild as Guild | null;

    const load = () => window.fetch2.get("/api/guilds").then((res) => setGuilds(res.data || []));
    useEffect(() => { load().catch(() => setGuilds([])); }, []);
    useEffect(() => {
        if (!active) return;
        const refresh = () => window.fetch2.get(`/api/guilds/${active.id}/messages`).then((res) => setChat(res.data || []));
        refresh();
        const interval = window.setInterval(refresh, 4000);
        return () => window.clearInterval(interval);
    }, [active?.id]);

    const create = (event: FormEvent) => {
        event.preventDefault();
        window.fetch2.post("/api/guilds", { name }).then((res) => { setUser({ ...user!, guild: res.data }); setName(""); setMessage("Clan created."); return load(); }).catch((err) => setMessage(err?.data?.message || "Could not create clan."));
    };

    if (!user) return null;
    if (active) return <main className={styles.page}>
        <header className={styles.hero}><span>CLAN HQ</span><h1>{active.name}</h1><div className={styles.stats}><div><strong>{active.level}</strong><small>LEVEL</small></div><div><strong>{active.memberCount || active.members?.length || 0}/25</strong><small>MEMBERS</small></div><div><strong>{active.experience}</strong><small>XP</small></div></div></header>
        <section className={styles.chat}><div className={styles.sectionHeading}><h2>Clan chat</h2><span>LIVE</span></div><div className={styles.messages}>{chat.map((entry) => <div key={entry.id}><strong>{entry.username}</strong> {entry.content}</div>)}</div><form onSubmit={(event) => { event.preventDefault(); window.fetch2.post(`/api/guilds/${active.id}/messages`, { content: chatText }).then(() => { setChatText(""); return window.fetch2.get(`/api/guilds/${active.id}/messages`); }).then((res) => setChat(res.data)); }}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Say something to your clan" /><button>Send</button></form></section>
        {active.ownerId === user.id && active.requests?.length > 0 && <section className={styles.requests}><div className={styles.sectionHeading}><h2>Join requests</h2><span>{active.requests.length}</span></div>{active.requests.map((requestId) => <div className={styles.request} key={requestId}><span>{requestId}</span><button onClick={() => window.fetch2.post(`/api/guilds/${active.id}/accept`, { userId: requestId }).then((res) => setUser({ ...user, guild: res.data })).catch((err) => setMessage(err?.data?.message || "Could not accept request."))}>Accept</button></div>)}</section>}
    </main>;

    return <main className={styles.page}><header className={styles.hero}><span>CLANS</span><h1>Find your people</h1><p>Build a crew, collect XP, and climb together.</p></header><form className={styles.create} onSubmit={create}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="New clan name" maxLength={24} /><button>Create clan</button></form>{message && <p className={styles.message}>{message}</p>}<section className={styles.list}>{guilds.map((guild) => <article key={guild.id}><div><h2>{guild.name}</h2><p>Level {guild.level} · {guild.memberCount}/25 members</p></div><button onClick={() => window.fetch2.post(`/api/guilds/${guild.id}/join`, {}).then(() => setMessage("Join request sent.")).catch((err) => setMessage(err?.data?.message || "Could not join clan."))}>Request to join</button></article>)}</section></main>;
}
