import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { PageHeader } from "@components/index";
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
        window.fetch2.post("/api/guilds", { name }).then((res) => { setUser({ ...user!, guild: res.data }); setName(""); setMessage("Guild created."); return load(); }).catch((err) => setMessage(err?.data?.message || "Could not create guild."));
    };

    if (!user) return null;
    if (active) return <>
        <PageHeader>Guilds</PageHeader>
        <main className={styles.page}>
            <header className={styles.hero}>
                <div className={styles.crest}><i className="fas fa-shield-alt" /></div>
                <div className={styles.heroCopy}><span>YOUR GUILD</span><h1>{active.name}</h1><p>Work together, earn XP, and rise through the ranks.</p></div>
                <div className={styles.stats}>
                    <div><strong>{active.level}</strong><small>LEVEL</small></div>
                    <div><strong>{active.memberCount || active.members?.length || 0}<em>/25</em></strong><small>MEMBERS</small></div>
                    <div><strong>{active.experience}</strong><small>XP</small></div>
                </div>
            </header>
            <div className={styles.dashboard}>
                <section className={styles.chat}><div className={styles.sectionHeading}><h2><i className="fas fa-comments" /> Guild chat</h2><span><i className="fas fa-circle" /> LIVE</span></div><div className={styles.messages}>{chat.length ? chat.map((entry) => <div key={entry.id}><strong>{entry.username}</strong><p>{entry.content}</p></div>) : <p className={styles.empty}>No messages yet. Start the conversation!</p>}</div><form onSubmit={(event) => { event.preventDefault(); window.fetch2.post(`/api/guilds/${active.id}/messages`, { content: chatText }).then(() => { setChatText(""); return window.fetch2.get(`/api/guilds/${active.id}/messages`); }).then((res) => setChat(res.data)); }}><input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Say something to your guild" /><button><i className="fas fa-paper-plane" /> Send</button></form></section>
                {active.ownerId === user.id && active.requests?.length > 0 && <section className={styles.requests}><div className={styles.sectionHeading}><h2><i className="fas fa-user-plus" /> Join requests</h2><span>{active.requests.length}</span></div>{active.requests.map((requestId) => <div className={styles.request} key={requestId}><span>{requestId}</span><button onClick={() => window.fetch2.post(`/api/guilds/${active.id}/accept`, { userId: requestId }).then((res) => setUser({ ...user, guild: res.data })).catch((err) => setMessage(err?.data?.message || "Could not accept request."))}>Accept</button></div>)}</section>}
            </div>
        </main>
    </>;

    return <>
        <PageHeader>Guilds</PageHeader>
        <main className={styles.page}><header className={styles.hero}><div className={styles.crest}><i className="fas fa-shield-alt" /></div><div className={styles.heroCopy}><span>GUILD HALL</span><h1>Find your people</h1><p>Build a crew, collect XP, and climb together.</p></div></header><form className={styles.create} onSubmit={create}><i className="fas fa-flag" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name your new guild" maxLength={24} /><button><i className="fas fa-plus" /> Create guild</button></form>{message && <p className={styles.message}>{message}</p>}<section className={styles.list}><div className={styles.listHeading}><h2>Open guilds</h2><span>{guilds.length} {guilds.length === 1 ? "guild" : "guilds"}</span></div>{guilds.length ? guilds.map((guild) => <article key={guild.id}><div className={styles.guildIcon}><i className="fas fa-shield-alt" /></div><div className={styles.guildInfo}><h2>{guild.name}</h2><p><strong>Level {guild.level}</strong><span />{guild.memberCount || guild.members?.length || 0}/25 members</p></div><button onClick={() => window.fetch2.post(`/api/guilds/${guild.id}/join`, {}).then(() => setMessage("Join request sent.")).catch((err) => setMessage(err?.data?.message || "Could not join guild."))}>Join guild <i className="fas fa-arrow-right" /></button></article>) : <div className={styles.emptyList}><i className="fas fa-users-slash" /><p>No guilds have been created yet.</p></div>}</section></main>
    </>;
}
