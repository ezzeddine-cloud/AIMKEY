"use client";

import { useEffect, useState } from "react";
import { ForumView } from "./ForumView";
import {
  createForumPost,
  createForumReply,
  deleteForumReplyCascade,
  deleteForumPostCascade,
  reportForumPostWithAdminNotification,
  subscribeForumPosts,
  subscribeForumRepliesMap,
  voteForumPostWithUser,
  voteForumReplyWithUser,
} from "@/lib/firebase/appContentRepos";
import type { ForumPost, ForumReplyDoc, UserRole } from "@/models/types";

export function ForumFirestorePanel({
  t,
  isRTL,
  userUid,
  userEmail,
  viewerRole,
  isAdmin = false,
}: {
  t: (fr: string, ar: string) => string;
  isRTL: boolean;
  userUid: string;
  userEmail: string | null;
  viewerRole: UserRole;
  isAdmin?: boolean;
}) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [repliesByPostId, setRepliesByPostId] = useState<Record<string, ForumReplyDoc[]>>({});

  useEffect(() => {
    const unsub = subscribeForumPosts(setPosts);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeForumRepliesMap(setRepliesByPostId);
    return () => unsub();
  }, []);

  return (
    <ForumView
      t={t}
      isRTL={isRTL}
      posts={posts}
      repliesByPostId={repliesByPostId}
      viewerRole={viewerRole}
      isAdmin={isAdmin}
      onVote={(id, type) => void voteForumPostWithUser(id, userUid, type)}
      onVoteReply={(postId, replyId, type) => void voteForumReplyWithUser(postId, replyId, userUid, type)}
      onReport={async (post, reason) => {
        await reportForumPostWithAdminNotification({
          postId: post.id,
          postTitle: post.title,
          reporterUid: userUid,
          reporterEmail: userEmail ?? "",
          reason,
        });
      }}
      onDeletePost={isAdmin ? async (id) => { await deleteForumPostCascade(id); } : undefined}
      userUid={userUid}
      onDeleteReply={async (postId, replyId) => {
        await deleteForumReplyCascade(postId, replyId, { isAdmin });
      }}
      onAddReply={async (postId, { text, emoji, anonymous, parentReplyId }) => {
        const name = userEmail?.split("@")[0] || "User";
        await createForumReply({
          postId,
          authorUid: userUid,
          authorEmail: userEmail ?? "",
          authorName: name,
          authorRole: viewerRole,
          anonymous,
          text,
          emoji,
          parentReplyId: parentReplyId ?? null,
        });
      }}
      currentUserLabel={userEmail ?? userUid}
      onCreatePost={async ({ title, content, tags, anonymous }) => {
        const name = userEmail?.split("@")[0] || "Citoyen";
        await createForumPost({
          authorUid: userUid,
          authorEmail: userEmail ?? "",
          authorName: name,
          authorRole: viewerRole,
          anonymous,
          title,
          content,
          tags,
        });
      }}
    />
  );
}
