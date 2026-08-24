import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const clientEnv = {
        VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || (mode === "development" ? env.VITE_BACKEND_URL || "" : ""),
        VITE_MEDIA_URL: env.VITE_MEDIA_URL || "https://blacket-rewrite-frontend.onrender.com",
        VITE_MEDIA_BACKUP_URL: env.VITE_MEDIA_BACKUP_URL || "https://blacket-rewrite-frontend.onrender.com",
        VITE_INFORMATION_NAME: env.VITE_INFORMATION_NAME || "Blacket",
        VITE_INFORMATION_VERSION: env.VITE_INFORMATION_VERSION || "local",
        VITE_INFORMATION_PRONUNCIATION: env.VITE_INFORMATION_PRONUNCIATION || "black-et",
        VITE_INFORMATION_DISCORD: env.VITE_INFORMATION_DISCORD || "https://discord.com",
        VITE_CDN_URL: env.VITE_CDN_URL || "",
        VITE_UPLOAD_PATH: env.VITE_UPLOAD_PATH || "",
        VITE_STRIPE_PUBLIC_KEY: env.VITE_STRIPE_PUBLIC_KEY || "",
        VITE_TURNSTILE_SITE_KEY: env.VITE_TURNSTILE_SITE_KEY || ""
    };

    return {
    plugins: [react()],
    define: {
        ...Object.fromEntries(Object.entries(clientEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]))
    },
    resolve: {
        alias: {
            "react-textfit": "/src/components/Textfit",
            "@brender": "/src/brender",
            "@components": "/src/components",
            "@constants": "/src/constants",
            "@controllers": "/src/controllers",
            "@functions": "/src/functions",
            "@stores": "/src/stores"
        },
        preserveSymlinks: true
    },
    server: {
        proxy: {
            "/api": {
                target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
                changeOrigin: true,
                ws: true
            },
            "/gateway": {
                target: process.env.VITE_BACKEND_URL || "http://localhost:4000",
                changeOrigin: true,
                ws: true
            }
        },
        allowedHosts: [
            ...process.env.VITE_ALLOWED_ORIGINS ? process.env.VITE_ALLOWED_ORIGINS.split(",").map((origin) => {
                const url = new URL(origin);

                return url.hostname;
            }) : []
        ],
        fs: {
            strict: true
        }
    },
    css: {
        modules: {
            scopeBehaviour: "local",
            localsConvention: "camelCaseOnly",
            generateScopedName: "[name]__[local]___[hash:base64:5]"
        }
    },
    build: {
        target: "es2022",
        outDir: "./dist",
        rollupOptions: {
            output: {
                manualChunks: (id: string) => {
                    if (id.includes("node_modules")) return "vendor";
                    return "main";
                },
                chunkFileNames: "[name].[hash].js",
                entryFileNames: "[name].[hash].js",
                assetFileNames: "[name].[hash].[ext]"
            }
        },
        chunkSizeWarningLimit: 1000,
        manifest: true,
        minify: "terser",
        terserOptions: {
            format: {
                comments: false
            },
            compress: {
                sequences: true,
                booleans: true,
                loops: true,
                toplevel: true,
                unsafe: true,
                drop_console: false,
                unsafe_comps: true,
                passes: 2
            },
            module: true
        }
    }
    };
});
