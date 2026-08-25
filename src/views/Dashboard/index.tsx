@@
-                    <div className={styles.userBadges}>
-                        {[...(viewingUser.badges || [])].sort((a, b) => a.priority - b.priority).map((badge) => badge.imageId && <div className={styles.badgeContainer} key={badge.id}>
-                            <ImageOrVideo src={resourceIdToPath(badge.imageId)} alt={badge.name} />
-                        </div>)}
-                    </div>
+                    <div className={styles.userBadges}>
+                        {[...(viewingUser.badges || [])]
+                            .sort((a, b) => (a.priority || 0) - (b.priority || 0))
+                            .map((badge) => {
+                                const imageId = badge.imageId || badge.resourceId || badge.image || badge.imagePath;
+                                if (!imageId) return null;
+
+                                const src = resourceIdToPath(imageId);
+
+                                return (
+                                    <div className={styles.badgeContainer} key={badge.id || badge.name || imageId}>
+                                        <ImageOrVideo
+                                            src={src}
+                                            alt={badge.name || ""}
+                                            onError={(e: any) => { try { e.currentTarget.src = window.constructCDNUrl('/content/icons/error.png'); } catch {} }}
+                                        />
+                                    </div>
+                                );
+                            })}
+                    </div>
