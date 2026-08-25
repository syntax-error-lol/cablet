import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { Post } from "./components";
import styles from "./news.module.scss";

interface NewsPost {
    id: string;
    title: string;
    content: string;
    image?: string;
    createdAt: string;
    author: any;
    votes: { upvotes: number; downvotes: number };
}

export default function News() {
    const [news, setNews] = useState<NewsPost[]>([]);

    const { user } = useUser();

    useEffect(() => {
        window.fetch2.get("/api/news")
            .then((res) => setNews(res.data));
    }, []);

    if (!user) return <Navigate to="/login" />;

    return (
        <>
            {<div className={styles.posts}>
                {news.map((post) => (
                    <Post
                        key={post.id}
                        post={post}
                    />
                ))}
            </div>}
        </>
    );
}
