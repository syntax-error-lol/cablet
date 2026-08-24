import { createServer } from "node:http";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
        { id: 1, path: "/content/blooks/Default.webp" },
        { id: 2, path: "/content/banners/Default.webp" },
        { id: 3, path: "/content/logo.webp" },
        { id: 4, path: "/content/content-background.webp" }
    ],
    badges: [{ id: 1, name: "Owner", imageId: 3, priority: 0 }],
    banners: [{ id: 1, name: "Default Banner", imageId: 2 }],
    blooks: [{ id: 1, name: "Default Blook", imageId: 1, rarityId: 1, description: "A local starter blook.", isBig: false }],
    emojis: [],
    fonts: [],
    items: [],
    "item-shop": [],
    packs: [{ id: 1, name: "Starter Pack", imageId: 1, backgroundId: 4, price: 0, rarityIds: [1], enabled: true }],
    rarities: [{ id: 1, name: "Common", color: "#7f8c8d", animationType: "COMMON" }],
    titles: [],
    products: [],
    "spinny-wheels": []
    ,boosters: {
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
    permissions: user.username.toLowerCase() === "syntax" ? staffPermissions : (user.permissions || []),
    badges: user.username.toLowerCase() === "syntax" ? catalog.badges : (user.badges || []),
    blooks: user.blooks || [],
    authMethods: [],
    color: "#ffffff",
    crystals: 0,
    createdAt: user.createdAt,
    fontId: 0,
    paymentMethods: [],
    titleId: 0,
    settings: { lowPerformanceMode: false, friendRequests: "ON" },
    statistics: { packsOpened: 0, messagesSent: 0 },
    tokens: user.tokens || 0,
    diamonds: 0,
    experience: user.experience || 0
});

const currentUser = (request) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    return sessions.get(token);
};

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
        ico: "image/x-icon",
        gif: "image/gif",
        png: "image/png",
        webp: "image/webp",
        woff2: "font/woff2"
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
        const user = { id: randomUUID(), username, createdAt: new Date().toISOString(), passwordSalt, passwordHash: hashPassword(password, passwordSalt), permissions: [], badges: [] };
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

    if (path === "/api/market/open-pack" && request.method === "POST") {
        const user = currentUser(request);
        const body = await readBody(request);
        const pack = catalog.packs.find((entry) => entry.id === Number(body.packId));
        if (!user) return json(response, 401, { message: "Not authenticated" });
        if (!pack || !pack.enabled) return json(response, 404, { message: "Unknown pack" });
        if ((user.tokens || 0) < pack.price) return json(response, 403, { message: "Not enough tokens" });

        const blook = catalog.blooks[Math.floor(Math.random() * catalog.blooks.length)];
        const userBlook = {
            id: randomUUID(),
            blookId: blook.id,
            shiny: false,
            serial: (user.blooks || []).filter((entry) => entry.blookId === blook.id).length + 1
        };
        user.blooks = [...(user.blooks || []), userBlook];
        user.tokens = (user.tokens || 0) - pack.price;
        user.statistics = { ...(user.statistics || {}), packsOpened: (user.statistics?.packsOpened || 0) + 1 };
        saveUsers();
        return json(response, 200, userBlook);
    }

    if (path === "/api/data/resources") return json(response, 200, catalog.resources);

    if (path === "/api/leaderboard") return json(response, 200, { diamonds: [], experience: [] });
    if (path === "/api/users/transactions") return json(response, 200, []);

    const key = path.replace("/api/data/", "");
    if (Object.hasOwn(catalog, key)) return json(response, 200, catalog[key]);

    if (path === "/api/friends") return json(response, 200, { friends: [], friendedBy: [], blocked: [] });
    if (path === "/api/news") return json(response, 200, []);

    return json(response, 200, {});
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Local Blacket backend listening on http://localhost:${port}`);
});