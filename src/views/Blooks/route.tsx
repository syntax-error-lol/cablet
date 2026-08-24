import Blooks from "./index";

export default {
    path: "/blooks",
    component: <Blooks />,
    title: `Blooks | ${import.meta.env.VITE_INFORMATION_NAME}`,
    description: "View the blooks you have collected from packs.",
    sidebar: true,
    topRight: ["tokens", "diamonds"],
    topRightDesktopOnly: true
} as BlacketRoute;