import { createServer } from "node:http";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server as SocketServer } from "socket.io";

const port = Number(process.env.PORT || process.env.SERVER_PORT || 4000);
const staticRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const config = {
    name: "Blacket",
    version: "local",
    mode: "DEVELOPMENT",
    description: "A local Blacket development server"
};
const staffPermissions = [
    "CHANGE_NAME_COLOR_TIER_1",
    "CHANGE_NAME_COLOR_TIER_2",
    "CHANGE_USERNAME",
    "CREATE_REPORTS",
    "CUSTOM_AVATAR",
    "CUSTOM_BANNER",
    "LESS_AUCTION_TAX",
    "MANAGE_MESSAGES",
    "MANAGE_REPORTS",
    "MANAGE_USERS",
    "MUTE_USERS",
    "UPLOAD_FILES_LARGE",
    "UPLOAD_FILES_MEDIUM",
    "UPLOAD_FILES_SMALL",
    "USE_CHAT_COLORS",
    "VIEW_AUDIT"
];

const catalog = {
    resources: [
        { id: 1, path: "/content/blooks/Default.png" },
        { id: 2, path: "/content/banners/Default.png" },
        { id: 12, path: "/content/banners/Neon.svg" },
        { id: 13, path: "/content/banners/Sunset.svg" },
        { id: 14, path: "/content/banners/Ocean.svg" },
        { id: 3, path: "/content/logo.png" },
        { id: 4, path: "/content/background.png" },
        { id: 5, path: "/content/blooks/Information.png" },
        { id: 6, path: "/content/blooks/Console.gif" },
        { id: 7, path: "/content/blooks/Warning.png" },
        { id: 8, path: "/content/packs/Debug.png" },
        { id: 9, path: "/content/packs/Miscellaneous.png" },
        { id: 10, path: "/content/shield.png" },
        { id: 11, path: "/content/levelStar.png" }
    ],
    badges: [
        { id: 1, name: "Owner", imageId: 3, priority: 0 },
        { id: 2, name: "Staff", imageId: 10, priority: 1 },
        { id: 3, name: "Founder", imageId: 11, priority: 2 },
        { id: 4, name: "Early Supporter", imageId: 10, priority: 3 },
        { id: 5, name: "Collector", imageId: 11, priority: 4 }
    ],
    banners: [
        { id: 1, name: "Default Banner", imageId: 2 },
        { id: 2, name: "Neon Nights", imageId: 12 },
        { id: 3, name: "Sunset", imageId: 13 },
        { id: 4, name: "Ocean", imageId: 14 }
    ],
    blooks: [
        { id: 1, name: "Lil Bot", imageId: 1, rarityId: 1, packId: 1, chance: 19.5, price: 5, description: "A friendly little bot.", isBig: false },
        { id: 2, name: "Lovely Bot", imageId: 5, rarityId: 1, packId: 1, chance: 19.5, price: 10, description: "A bot with a kind heart.", isBig: false },
        { id: 3, name: "Angry Bot", imageId: 6, rarityId: 1, packId: 1, chance: 19.5, price: 25, description: "A bot having a rough day.", isBig: false },
        { id: 4, name: "Happy Bot", imageId: 7, rarityId: 2, packId: 1, chance: 19.5, price: 50, description: "A bot that is always smiling.", isBig: false }
    ],
    emojis: [],
    fonts: [],
    items: [{ id: 1, name: "Lucky Charm", imageId: 10, rarityId: 1, description: "A small charm that makes every win feel better." }],
    "item-shop": [{ id: 1, type: "ITEM", itemId: 1, price: 75, weekly: false }],
    packs: [
        { id: 1, name: "Bot Pack", imageId: 9, backgroundId: 4, price: 25, rarityIds: [1, 2], enabled: true }
    ],
    rarities: [
        { id: 1, name: "Common", color: "#7f8c8d", animationType: "COMMON" },
        { id: 2, name: "Rare", color: "#3498db", animationType: "RARE" },
        { id: 3, name: "Epic", color: "#9b59b6", animationType: "EPIC" }
    ],
    titles: [],
    products: [{ id: 1, name: "Blacket Plus", description: "Free Plus access for everyone.", imageId: 3, price: 0, subscriptionPrice: 0, isSubscription: true, isQuantityCapped: true, local: true, color1: "#0d9488", color2: "#164e63" }],
    stores: [{ id: 1, name: "Memberships", description: "Make your profile feel like yours.", priority: 0, products: [1] }],
    "spinny-wheels": [],
    boosters: {
        global: { chance: null, shiny: null },
        personal: { chance: null, shiny: null }
    }
};

const dataPath = process.env.LOCAL_DATA_FILE || fileURLToPath(new URL("./local-data.json", import.meta.url));
const loadUsers = () => {
    if (!existsSync(dataPath)) return new Map();

    try {
        const data = JSON.parse(readFileSync(dataPath, "utf8"));
        return new Map((data.users || []).map((user) => [user.username.toLowerCase(), user]));
    } catch {
        console.warn(`Could not read local data file at ${dataPath}; starting with an empty user store.`);
        return new Map();
    }
};
const users = loadUsers();
const sessions = new Map();
const messages = new Map();
const guilds = new Map();
if (existsSync(dataPath)) {
    try {
        const saved = JSON.parse(readFileSync(dataPath, "utf8"));
        for (const guild of saved.guilds || []) guilds.set(guild.id, guild);
    } catch { /* users loader reports malformed local data */ }
}
const isOwner = (user) => user?.username?.toLowerCase() === "syntax";

const hashPassword = (password, salt) => scryptSync(password, salt, 64).toString("hex");
const passwordMatches = (user, password) => {
    if (!user.passwordHash || !user.passwordSalt) return false;

    const expected = Buffer.from(user.passwordHash, "hex");
    const actual = Buffer.from(hashPassword(password, user.passwordSalt), "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const saveUsers = () => {
    mkdirSync(dirname(dataPath), { recursive: true });
    writeFileSync(dataPath, JSON.stringify({ users: [...users.values()], guilds: [...guilds.values()] }, null, 2));
};

const json = (response, status, body) => {
    response.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    response.end(JSON.stringify(body));
};

const readBody = (request) => new Promise((resolve) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch { resolve({}); }
    });
});

const publicUser = (user) => ({
    ...user,
    password: undefined,
    passwordHash: undefined,
    passwordSalt: undefined,
    role: isOwner(user) ? "OWNER" : "USER",
    isOwner: isOwner(user),
    permissions: isOwner(user) ? staffPermissions : (user.permissions || []),
    badges: user.badges || [],
    blooks: user.blooks || [],
    items: user.items || [],
    guild: [...guilds.values()].find((guild) => guild.members.includes(user.id)) || null,
    authMethods: [],
    avatarUrl: user.avatarUrl || "",
    color: user.color || "#ffffff",
    crystals: 0,
    createdAt: user.createdAt,
    fontId: user.fontId || 0,
    paymentMethods: [],
    titleId: 0,
    settings: { lowPerformanceMode: false, friendRequests: "ON", ...(user.settings || {}) },
    statistics: { packsOpened: 0, messagesSent: 0, ...(user.statistics || {}) },
    tokens: user.tokens ?? (isOwner(user) ? 10000 : 0),
    diamonds: user.diamonds || 0,
    experience: user.experience || 0,
    plusUntil: "9999-12-31T23:59:59.999Z"
});

const currentUser = (request) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    return sessions.get(token);
};

const chatMessage = (user, roomId, body) => ({
    id: randomUUID(), roomId, authorId: user.id, author: publicUser(user),
    content: String(body.content || ""), color: user.settings?.chatColor || "#ffffff",
    mentions: [], replyingToId: body.replyingTo || null, replyingTo: undefined,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    discordMessageId: null, deletedAt: null, editedAt: null, nonce: body.nonce
});

const serveFrontend = (request, response) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
    const filePath = resolve(staticRoot, relativePath);
    const fallbackPath = join(staticRoot, "index.html");
    const target = filePath.startsWith(resolve(staticRoot)) && existsSync(filePath) ? filePath : fallbackPath;
    const extension = target.split(".").pop();
    const contentTypes = {
        html: "text/html; charset=utf-8",
        css: "text/css; charset=utf-8",
        js: "text/javascript; charset=utf-8",
        json: "application/json",
        svg: "image/svg+xml",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        ico: "image/x-icon",
        gif: "image/gif",
        png: "image/png",
        webp: "image/webp",
        woff: "font/woff",
        woff2: "font/woff2",
        ttf: "font/ttf",
        otf: "font/otf",
        mp3: "audio/mpeg",
        ogg: "audio/ogg",
        mp4: "video/mp4",
        webm: "video/webm"
    };

    response.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
    response.end(readFileSync(target));
};

const server = createServer(async (request, response) => {
    if (request.method === "OPTIONS") return json(response, 204, null);
    if (request.url === "/health") return json(response, 200, {
        status: "ok",
        service: "blacket-local-backend",
        api: "/api"
    });
    if (!request.url?.startsWith("/api")) return serveFrontend(request, response);

    const path = request.url.split("?")[0];
    if (path === "/api") return json(response, 200, config);

    if (path === "/api/auth/register" && request.method === "POST") {
        const body = await readBody(request);
        const username = String(body.username || "").trim();
        const password = String(body.password || "");

        if (!username || password.length < 1) return json(response, 400, { message: "Username and password are required." });
        if (users.has(username.toLowerCase())) return json(response, 409, { message: "That username is already taken." });

        const passwordSalt = randomUUID();
        const user = {
            id: randomUUID(), username, createdAt: new Date().toISOString(), passwordSalt,
            passwordHash: hashPassword(password, passwordSalt), permissions: [], badges: [],
            settings: { lowPerformanceMode: false, friendRequests: "ON", openPacksInstantly: false },
            statistics: { packsOpened: 0, messagesSent: 0 }, blooks: [], items: [], tokens: 250, diamonds: 0, experience: 0,
            plusUntil: "9999-12-31T23:59:59.999Z"
        };
        users.set(username.toLowerCase(), user);
        saveUsers();
        const token = randomUUID();
        sessions.set(token, user);
        return json(response, 201, { token });
    }

    if (path === "/api/auth/login" && request.method === "POST") {
        const body = await readBody(request);
        const user = users.get(String(body.username || "").toLowerCase());
        if (!user || !passwordMatches(user, String(body.password || ""))) return json(response, 401, { message: "Invalid username or password." });

        const token = randomUUID();
        sessions.set(token, user);
        return json(response, 200, { token });
    }

    if (path === "/api/auth/logout") {
        sessions.delete(request.headers.authorization?.replace(/^Bearer\s+/i, ""));
        return json(response, 200, {});
    }

    if (path === "/api/users/me") {
        const user = currentUser(request);
        return user ? json(response, 200, publicUser(user)) : json(response, 401, { message: "Not authenticated" });
    }

    if (path === "/api/guilds" && request.method === "GET") return json(response, 200, [...guilds.values()].map((guild) => ({ ...guild, memberCount: guild.members.length })));

    if (path === "/api/guilds" && request.method === "POST") {
        const user = currentUser(request);
        const body = await readBody(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if ([...guilds.values()].some((guild) => guild.members.includes(user.id) || guild.requests.includes(user.id))) return json(response, 409, { message: "You already belong to or requested to join a clan." });
        const name = String(body.name || "").trim();
        if (name.length < 2 || name.length > 24) return json(response, 400, { message: "Clan names must be 2 to 24 characters." });
        if ([...guilds.values()].some((guild) => guild.name.toLowerCase() === name.toLowerCase())) return json(response, 409, { message: "That clan name is already taken." });
        const guild = { id: randomUUID(), name, ownerId: user.id, level: 1, experience: 0, members: [user.id], requests: [], messages: [] };
        guilds.set(guild.id, guild);
        saveUsers();
        return json(response, 201, { ...guild, memberCount: 1 });
    }

    if (path.match(/^\/api\/guilds\/[^/]+\/(join|accept|messages)$/)) {
        const parts = path.split("/");
        const guild = guilds.get(parts[3]);
        const user = currentUser(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!guild) return json(response, 404, { message: "Clan not found" });
        if (parts[4] === "join" && request.method === "POST") {
            if (guild.members.includes(user.id)) return json(response, 409, { message: "You are already in this clan." });
            if (guild.members.length + guild.requests.length >= 25) return json(response, 409, { message: "This clan is full." });
            if (!guild.requests.includes(user.id)) guild.requests.push(user.id);
            saveUsers();
            return json(response, 200, { message: "Join request sent." });
        }
        if (parts[4] === "accept" && request.method === "POST") {
            const body = await readBody(request);
            if (guild.ownerId !== user.id) return json(response, 403, { message: "Only the clan owner can accept members." });
            if (guild.members.length >= 25) return json(response, 409, { message: "This clan is full." });
            const memberId = String(body.userId || "");
            if (!guild.requests.includes(memberId)) return json(response, 404, { message: "Join request not found." });
            guild.requests = guild.requests.filter((id) => id !== memberId);
            guild.members.push(memberId);
            saveUsers();
            return json(response, 200, { ...guild, memberCount: guild.members.length });
        }
        if (parts[4] === "messages" && request.method === "GET") return json(response, 200, guild.messages.slice(-50));
        if (parts[4] === "messages" && request.method === "POST") {
            const body = await readBody(request);
            if (!guild.members.includes(user.id)) return json(response, 403, { message: "Join the clan to use its chat." });
            const message = { id: randomUUID(), userId: user.id, username: user.username, content: String(body.content || "").trim(), createdAt: new Date().toISOString() };
            if (!message.content) return json(response, 400, { message: "Message cannot be empty." });
            guild.messages.push(message);
            saveUsers();
            return json(response, 201, message);
        }
    }

    if (path === "/api/staff/users" && request.method === "GET") {
        const user = currentUser(request);
        if (!user || !isOwner(user)) return json(response, 403, { message: "Staff access required" });
        return json(response, 200, [...users.values()].map(publicUser));
    }

    if (path === "/api/staff/reports" && request.method === "GET") {
        const user = currentUser(request);
        if (!user || !isOwner(user)) return json(response, 403, { message: "Staff access required" });
        return json(response, 200, []);
    }

    if (path.match(/^\/api\/staff\/users\/[^/]+$/) && request.method === "PATCH") {
        const owner = currentUser(request);
        if (!owner || !isOwner(owner)) return json(response, 403, { message: "Owner access required" });
        const target = [...users.values()].find((entry) => entry.id === decodeURIComponent(path.split("/").pop()));
        if (!target) return json(response, 404, { message: "Unknown user" });
        const body = await readBody(request);
        if (body.username !== undefined) {
            const username = String(body.username).trim();
            if (!/^[a-zA-Z0-9_-]+$/.test(username)) return json(response, 400, { message: "Invalid username" });
            const existing = users.get(username.toLowerCase());
            if (existing && existing.id !== target.id) return json(response, 409, { message: "That username is already taken." });
            users.delete(target.username.toLowerCase());
            target.username = username;
            users.set(username.toLowerCase(), target);
        }
        if (body.avatarUrl !== undefined) {
            const avatarUrl = String(body.avatarUrl).trim();
            if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) return json(response, 400, { message: "Custom PFP URL must use http or https." });
            target.avatarUrl = avatarUrl;
        }
        if (body.color !== undefined) target.color = String(body.color);
        if (body.fontId !== undefined) target.fontId = Number(body.fontId);
        if (body.titleId !== undefined) target.titleId = Number(body.titleId);
        for (const field of ["tokens", "diamonds", "experience"]) {
            if (body[field] !== undefined) {
                const value = Number(body[field]);
                if (!Number.isSafeInteger(value) || value < 0) return json(response, 400, { message: `${field} must be a non-negative integer.` });
                target[field] = value;
            }
        }
        if (Array.isArray(body.badges)) target.badges = body.badges.map((id) => catalog.badges.find((badge) => badge.id === Number(id))).filter(Boolean);
        saveUsers();
        return json(response, 200, publicUser(target));
    }

    if (path.match(/^\/api\/chat\/messages\/\d+$/) && request.method === "GET") {
        const roomId = Number(path.split("/").pop());
        return json(response, 200, (messages.get(roomId) || []).slice(-50).reverse());
    }

    if (path.match(/^\/api\/chat\/messages\/\d+$/) && request.method === "POST") {
        const user = currentUser(request);
        const body = await readBody(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!String(body.content || "").trim()) return json(response, 400, { message: "Message cannot be empty." });
        const roomId = Number(path.split("/").pop());
        const message = chatMessage(user, roomId, body);
        messages.set(roomId, [...(messages.get(roomId) || []), message]);
        user.statistics = { ...(user.statistics || {}), messagesSent: (user.statistics?.messagesSent || 0) + 1 };
        saveUsers();
        io.emit("chat:messages:create", message);
        return json(response, 201, message);
    }

    if (path.match(/^\/api\/chat\/messages\/\d+\/[^/]+$/) && (request.method === "PUT" || request.method === "DELETE")) {
        const user = currentUser(request);
        const parts = path.split("/");
        const roomId = Number(parts[4]);
        const messageId = parts[5];
        const roomMessages = messages.get(roomId) || [];
        const message = roomMessages.find((entry) => entry.id === messageId);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!message) return json(response, 404, { message: "Message not found" });
        if (message.authorId !== user.id && !isOwner(user)) return json(response, 403, { message: "You cannot change this message." });
        if (request.method === "PUT") {
            const body = await readBody(request);
            message.content = String(body.content || "");
            message.editedAt = new Date().toISOString();
        } else message.deletedAt = new Date().toISOString();
        messages.set(roomId, roomMessages);
        io.emit(request.method === "PUT" ? "chat:messages:update" : "chat:messages:delete", request.method === "PUT" ? message : { messageId });
        saveUsers();
        return json(response, 200, {});
    }

    if (path.startsWith("/api/users/") && request.method === "GET") {
        const identifier = decodeURIComponent(path.slice("/api/users/".length));
        const user = users.get(identifier.toLowerCase()) || [...users.values()].find((entry) => entry.id === identifier);
        return user ? json(response, 200, publicUser(user)) : json(response, 404, { message: "Unknown user" });
    }

    if (path === "/api/settings" && request.method === "PATCH") {
        const user = currentUser(request);
        const body = await readBody(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        user.settings = { ...(user.settings || {}), [String(body.key)]: body.value };
        saveUsers();
        return json(response, 200, {});
    }

    if (path === "/api/settings/username" && request.method === "PATCH") {
        const user = currentUser(request);
        const body = await readBody(request);
        const newUsername = String(body.newUsername || "").trim();
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) return json(response, 400, { message: "Invalid username" });
        if (users.has(newUsername.toLowerCase())) return json(response, 409, { message: "That username is already taken." });
        users.delete(user.username.toLowerCase());
        user.username = newUsername;
        users.set(newUsername.toLowerCase(), user);
        saveUsers();
        return json(response, 200, {});
    }

    if (path === "/api/quests/claim-daily-tokens" && request.method === "PUT") {
        const user = currentUser(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        const today = new Date().toISOString().slice(0, 10);
        if (user.lastClaimed === today) return json(response, 409, { message: "Daily tokens already claimed." });
        user.lastClaimed = today;
        user.tokens = (user.tokens || 0) + 100;
        saveUsers();
        return json(response, 200, { tokens: 100 });
    }

    if (path === "/api/blooks/sell-blooks" && request.method === "PUT") {
        const user = currentUser(request);
        const body = await readBody(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        const ids = Array.isArray(body.blooks) ? body.blooks : [];
        const sold = (user.blooks || []).filter((entry) => ids.includes(entry.id));
        const value = sold.reduce((total, entry) => total + (catalog.blooks.find((blook) => blook.id === entry.blookId)?.price || 0), 0);
        user.blooks = (user.blooks || []).filter((entry) => !ids.includes(entry.id));
        user.diamonds = (user.diamonds || 0) + value;
        saveUsers();
        return json(response, 200, {});
    }

    if (path.startsWith("/api/cosmetics/") && (request.method === "PATCH" || request.method === "POST")) {
        const user = currentUser(request);
        const body = await readBody(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (path.includes("/color/")) user.color = body.color;
        if (path === "/api/cosmetics/font") user.fontId = body.fontId;
        if (path === "/api/cosmetics/title") user.titleId = body.titleId;
        if (path === "/api/cosmetics/avatar") user.avatarId = body.avatarId;
        if (path === "/api/cosmetics/banner") user.bannerId = catalog.banners.find((banner) => banner.id === Number(body.bannerId))?.imageId;
        saveUsers();
        return json(response, 200, {});
    }

    if (path === "/api/market/open-pack" && request.method === "POST") {
        const user = currentUser(request);
        const body = await readBody(request);
        const pack = catalog.packs.find((entry) => entry.id === Number(body.packId));
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!pack || !pack.enabled) return json(response, 404, { message: "Unknown pack" });
        if (!isOwner(user) && (user.tokens || 0) < pack.price) return json(response, 403, { message: "Not enough tokens" });

        const packBlooks = catalog.blooks.filter((entry) => entry.packId === pack.id);
        if (!packBlooks.length) return json(response, 404, { message: "Pack has no blooks" });
        const totalChance = packBlooks.reduce((total, entry) => total + (entry.chance || 0), 0);
        let randomChance = Math.random() * totalChance;
        const blook = packBlooks.find((entry) => {
            randomChance -= entry.chance || 0;
            return randomChance <= 0;
        }) || packBlooks[packBlooks.length - 1];
        const userBlook = {
            id: randomUUID(),
            blookId: blook.id,
            shiny: false,
            serial: (user.blooks || []).filter((entry) => entry.blookId === blook.id).length + 1
        };
        user.blooks = [...(user.blooks || []), userBlook];
        user.tokens = isOwner(user) ? (user.tokens ?? 10000) : (user.tokens || 0) - pack.price;
        user.statistics = { ...(user.statistics || {}), packsOpened: (user.statistics?.packsOpened || 0) + 1 };
        const guild = [...guilds.values()].find((entry) => entry.members.includes(user.id));
        if (guild) {
            guild.experience += 10;
            guild.level = Math.floor(guild.experience / 100) + 1;
        }
        saveUsers();
        return json(response, 200, userBlook);
    }

    if (path.match(/^\/api\/market\/item-shop\/\d+$/) && request.method === "POST") {
        const user = currentUser(request);
        const entry = catalog["item-shop"].find((item) => item.id === Number(path.split("/").pop()));
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!entry) return json(response, 404, { message: "Item not found" });
        if ((user.tokens || 0) < entry.price) return json(response, 403, { message: "Not enough tokens" });
        user.tokens -= entry.price;
        user.items = [...(user.items || []), { id: randomUUID(), itemId: entry.itemId, usesLeft: 1 }];
        saveUsers();
        return json(response, 201, user.items[user.items.length - 1]);
    }

    if (path === "/api/data/resources") return json(response, 200, catalog.resources);

    if (path === "/api/stripe/stores") return json(response, 200, catalog.stores);

    if (path.match(/^\/api\/stripe\/local-purchase\/\d+$/) && request.method === "POST") {
        const user = currentUser(request);
        if (!user) return json(response, 401, { message: "Not authenticated" });
        const product = catalog.products.find((entry) => entry.id === Number(path.split("/").pop()));
        if (!product) return json(response, 404, { message: "Product not found" });
        user.plusUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        saveUsers();
        return json(response, 200, { plusUntil: user.plusUntil });
    }

    if (path === "/api/leaderboard") {
        const ranked = [...users.values()].sort((a, b) => (b.diamonds || 0) - (a.diamonds || 0));
        const experienced = [...users.values()].sort((a, b) => (b.experience || 0) - (a.experience || 0));
        return json(response, 200, {
            diamonds: ranked.slice(0, 50).map((entry) => entry.id),
            experience: experienced.slice(0, 50).map((entry) => entry.id)
        });
    }
    if (path === "/api/users/transactions") return json(response, 200, []);

    const key = path.replace("/api/data/", "");
    if (Object.hasOwn(catalog, key)) return json(response, 200, catalog[key]);

    if (path === "/api/friends") return json(response, 200, { friends: [], friendedBy: [], blocked: [] });
    if (path === "/api/news") return json(response, 200, []);

    return json(response, 200, {});
});

const io = new SocketServer(server, { path: "/gateway", cors: { origin: true, credentials: true } });
io.use((socket, next) => {
    const user = sessions.get(socket.handshake.auth?.token);
    if (!user) return next(new Error("Not authenticated"));
    socket.data.user = user;
    next();
});
io.on("connection", (socket) => {
    socket.on("ping", () => socket.emit("pong"));
    socket.on("chat:typing:started", (roomId) => {
        io.emit("chat:typing:started", { userId: socket.data.user.id, roomId, startedTypingAt: Date.now() });
    });
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Local Blacket backend listening on http://localhost:${port}`);
});