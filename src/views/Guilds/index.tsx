import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import GuildDiscovery from "./Discovery";

export default function Guilds() {
    const { user } = useUser();

    if (!user) return <Navigate to="/login" />;

    return <GuildDiscovery />;
}
