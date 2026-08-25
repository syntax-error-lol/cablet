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
        <header className={styles.hero}><span>CLAN HQ</span><h1>{active.name}</h1><p>Level {active.level} · {active.memberCount || active.members?.length || 0}/25 members · {active.experience} XP</p></header>
        <section className={styles.chat}><h2>Clan chat</h2><div className={styles.messages}>{chat.map((entry) => <div key={entry.id}><strong>{entry.username}</strong> {entry.content}</div>)}</div><form onSubmit={(event) => { event.preventDefault(); window.fetch2.post(`/api/guilds/${active.id}/messages`, { content: chatText }).then(() => { setChatText(""); return window.fetch2.get(`/api/guilds/${active.id}/messages`); }).then((res) => setChat(res.data)); }}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Say something to your clan" /><button>Send</button></form></section>
        {active.ownerId === user.id && active.requests?.length > 0 && <section className={styles.requests}><h2>Join requests</h2>{active.requests.map((requestId) => <div key={requestId}><span>{requestId}</span><button onClick={() => window.fetch2.post(`/api/guilds/${active.id}/accept`, { userId: requestId }).then((res) => setUser({ ...user, guild: res.data })).catch((err) => setMessage(err?.data?.message || "Could not accept request."))}>Accept</button></div>)}</section>}
    </main>;

    return <main className={styles.page}><header className={styles.hero}><span>CLANS</span><h1>Find your people</h1><p>Clans can hold up to 25 members. Owners approve every request.</p></header><form className={styles.create} onSubmit={create}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="New clan name" maxLength={24} /><button>Create clan</button></form>{message && <p>{message}</p>}<section className={styles.list}>{guilds.map((guild) => <article key={guild.id}><div><h2>{guild.name}</h2><p>Level {guild.level} · {guild.memberCount}/25 members</p></div><button onClick={() => window.fetch2.post(`/api/guilds/${guild.id}/join`, {}).then(() => setMessage("Join request sent.")).catch((err) => setMessage(err?.data?.message || "Could not join clan."))}>Request to join</button></article>)}</section></main>;
}
