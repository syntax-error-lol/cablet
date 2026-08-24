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
        { id: 3, name: "Founder", imageId: 11, priority: 2 }
    ],
    banners: [{ id: 1, name: "Default Banner", imageId: 2 }],
    blooks: [
        { id: 1, name: "Default Blook", imageId: 1, rarityId: 1, price: 5, description: "A local starter blook.", isBig: false },
        { id: 2, name: "Information Blook", imageId: 5, rarityId: 1, price: 10, description: "A helpful common blook.", isBig: false },
        { id: 3, name: "Console Blook", imageId: 6, rarityId: 2, price: 25, description: "A rare console blook.", isBig: false },
        { id: 4, name: "Warning Blook", imageId: 7, rarityId: 3, price: 50, description: "An epic warning blook.", isBig: false }
    ],
    emojis: [],
    fonts: [],
    items: [],
    "item-shop": [],
    packs: [
        { id: 1, name: "Starter Pack", imageId: 1, backgroundId: 4, price: 0, rarityIds: [1, 2], enabled: true },
        { id: 2, name: "Debug Pack", imageId: 8, backgroundId: 4, price: 25, rarityIds: [1, 2, 3], enabled: true },
        { id: 3, name: "Mystery Pack", imageId: 9, backgroundId: 4, price: 100, rarityIds: [2, 3], enabled: true }
    ],
    rarities: [
        { id: 1, name: "Common", color: "#7f8c8d", animationType: "COMMON" },
        { id: 2, name: "Rare", color: "#3498db", animationType: "RARE" },
        { id: 3, name: "Epic", color: "#9b59b6", animationType: "EPIC" }
    ],
    titles: [],
    products: [],
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
    writeFileSync(dataPath, JSON.stringify({ users: [...users.values()] }, null, 2));
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
    badges: isOwner(user) ? catalog.badges : (user.badges || []),
    blooks: user.blooks || [],
    authMethods: [],
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
    experience: user.experience || 0
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
            statistics: { packsOpened: 0, messagesSent: 0 }, blooks: [], tokens: 0, diamonds: 0, experience: 0
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
        if (body.color !== undefined) target.color = String(body.color);
        if (body.fontId !== undefined) target.fontId = Number(body.fontId);
        if (body.titleId !== undefined) target.titleId = Number(body.titleId);
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

        const blook = catalog.blooks[Math.floor(Math.random() * catalog.blooks.length)];
        const userBlook = {
            id: randomUUID(),
            blookId: blook.id,
            shiny: false,
            serial: (user.blooks || []).filter((entry) => entry.blookId === blook.id).length + 1
        };
        user.blooks = [...(user.blooks || []), userBlook];
        user.tokens = isOwner(user) ? (user.tokens ?? 10000) : (user.tokens || 0) - pack.price;
        user.statistics = { ...(user.statistics || {}), packsOpened: (user.statistics?.packsOpened || 0) + 1 };
        saveUsers();
        return json(response, 200, userBlook);
    }

    if (path === "/api/data/resources") return json(response, 200, catalog.resources);

    if (path === "/api/stripe/stores") return json(response, 200, []);

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