const localMedia: Record<string, string> = {
    "/content/logo.png": "/content/logo.webp",
    "/content/background.png": "/content/content-background.webp",
    "/content/blooks/Default.png": "/content/blooks/Default.webp",
    "/content/banners/Default.png": "/content/banners/Default.webp",
    "/content/auth-background.png": "/content/content-background.webp",
    "/content/icons/loading.png": "/content/logo.webp",
    "/content/icons/error.png": "/content/logo.webp",
    "/content/token.png": "/content/logo.webp",
    "/content/diamond.png": "/content/logo.webp",
    "/content/crystal.png": "/content/logo.webp",
    "/content/experience.png": "/content/logo.webp",
    "/content/level.png": "/content/logo.webp",
    "/content/404.png": "/content/logo.webp",
    "/content/blooks/backgrounds/Default.png": "/content/content-background.webp",
    "/content/icons/boost.png": "/content/logo.webp",
    "/content/icons/dashboardStatsBlooksUnlocked.png": "/content/logo.webp",
    "/content/icons/dashboardStatsGuild.png": "/content/logo.webp",
    "/content/icons/dashboardStatsMessagesSent.png": "/content/logo.webp",
    "/content/icons/dashboardStatsPacksOpened.png": "/content/logo.webp",
    "/content/icons/dashboardStatsUserID.png": "/content/logo.webp",
    "/content/icons/upload-avatar.png": "/content/logo.webp",
    "/content/icons/upload-banner.png": "/content/logo.webp",
    "/content/pack-top-end.png": "/content/logo.webp",
    "/content/packs/icons/DefaultTiled.png": "/content/logo.webp",
    "/content/particles/1.png": "/content/logo.webp",
    "/content/particles/2.png": "/content/logo.webp",
    "/content/particles/3.png": "/content/logo.webp",
    "/content/particles/4.png": "/content/logo.webp",
    "/content/particles/5.png": "/content/logo.webp",
    "/content/particles/6.png": "/content/logo.webp",
    "/content/particles/7.png": "/content/logo.webp",
    "/content/particles/8.png": "/content/logo.webp",
    "/content/shopkeeper.png": "/content/logo.webp",
    "/content/trading-plaza/bridge.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-1.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-2.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-3.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-4.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-5.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-6.png": "/content/content-background.webp",
    "/content/trading-plaza/grass-7.png": "/content/content-background.webp",
    "/content/trading-plaza/palm-tree.png": "/content/logo.webp",
    "/content/trading-plaza/pine-tree.png": "/content/logo.webp",
    "/content/trading-plaza/sand-1.png": "/content/content-background.webp",
    "/content/trading-plaza/sand-2.png": "/content/content-background.webp",
    "/content/trading-plaza/sand-3.png": "/content/content-background.webp",
    "/content/trading-plaza/sand-4.png": "/content/content-background.webp",
    "/content/trading-plaza/spawn-ring.png": "/content/logo.webp",
    "/content/trading-plaza/spawn.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-corner-1.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-corner-2.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-horizontal-1.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-horizontal-2.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-horizontal-3.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-horizontal-4.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-horizontal-5.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-1.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-2.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-3.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-4.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-5.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-6.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-7.png": "/content/content-background.webp",
    "/content/trading-plaza/transition-vertical-8.png": "/content/content-background.webp",
    "/content/trading-plaza/tree.png": "/content/logo.webp",
    "/content/trading-plaza/water.gif": "/content/content-background.webp",
    "/content/yapbot.png": "/content/logo.webp",
    "/content/zoey-sign.png": "/content/logo.webp"
};

const mediaPath = (base: string, path: string) => localMedia[path] || `${base}${path}`;

window.constructCDNUrl = (path: string) => mediaPath(import.meta.env.VITE_MEDIA_BACKUP_URL, path);

fetch(import.meta.env.VITE_MEDIA_URL)
    .then((res) => {
        if (res.ok) return import.meta.env.VITE_MEDIA_URL;
        else return import.meta.env.VITE_MEDIA_BACKUP_URL;
    })
    .catch(() => import.meta.env.VITE_MEDIA_BACKUP_URL)
    .then((res) => {
        window.constructCDNUrl = (path: string) => mediaPath(res, path);
    });

window.errorImage = window.constructCDNUrl("/content/icons/error.png");

window.constants = {
    APPLE_DEVICE: /iPad|iPhone|iPod/.test(navigator.userAgent),
    emojis: []
};

fetch(window.constructCDNUrl("/content/emojis.json"))
    .then((res) => res.json())
    .then((emojis) => {
        window.constants.emojis = emojis;
    });
