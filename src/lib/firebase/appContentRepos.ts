import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { COL } from "@/lib/firebase/collections";

/** UID Firebase Auth (obligatoire pour que les règles Firestore acceptent authorUid / sellerUid). */
function requireAuthUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Utilisateur non authentifié.");
  return uid;
}
import type {
  AdminNotification,
  CityEvent,
  ForumPost,
  ForumReplyDoc,
  MarketplaceMessage,
  MarketplaceProduct,
  NewsArticle,
  ReclamationDoc,
  UserRole,
} from "@/models/types";

function tsToIso(v: unknown): string | null {
  if (v && typeof v === "object" && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

/* ---------- News ---------- */

export function subscribeNews(cb: (items: NewsArticle[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.news), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const items: NewsArticle[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          titleFr: String(x.titleFr ?? ""),
          titleAr: String(x.titleAr ?? ""),
          bodyFr: String(x.bodyFr ?? ""),
          bodyAr: String(x.bodyAr ?? ""),
          imageUrl: String(x.imageUrl ?? "").trim(),
          createdAt: tsToIso(x.createdAt),
          authorUid: String(x.authorUid ?? ""),
        };
      });
      cb(items);
    },
    (err) => {
      console.warn("[news]", err.code, err.message);
      cb([]);
    },
  );
}

export async function createNewsArticle(data: {
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  authorUid: string;
  imageUrl?: string;
}) {
  const imageUrl = (data.imageUrl ?? "").trim();
  await addDoc(collection(getFirebaseDb(), COL.news), {
    titleFr: data.titleFr,
    titleAr: data.titleAr,
    bodyFr: data.bodyFr,
    bodyAr: data.bodyAr,
    authorUid: data.authorUid,
    ...(imageUrl ? { imageUrl } : {}),
    createdAt: serverTimestamp(),
  });
}

export async function updateNewsArticle(
  id: string,
  data: { titleFr: string; titleAr: string; bodyFr: string; bodyAr: string; imageUrl?: string },
) {
  const imageUrl = (data.imageUrl ?? "").trim();
  await updateDoc(doc(getFirebaseDb(), COL.news, id), {
    titleFr: data.titleFr.trim(),
    titleAr: data.titleAr.trim(),
    bodyFr: data.bodyFr.trim(),
    bodyAr: data.bodyAr.trim(),
    imageUrl: imageUrl || "",
  });
}

export async function deleteNewsArticle(id: string) {
  await deleteDoc(doc(getFirebaseDb(), COL.news, id));
}

/* ---------- Admin notifications (signalements, etc.) ---------- */

function mapAdminNotificationDoc(id: string, x: DocumentData): AdminNotification {
  return {
    id,
    type: "forum_post_report",
    postId: String(x.postId ?? ""),
    postTitle: String(x.postTitle ?? ""),
    reporterUid: String(x.reporterUid ?? ""),
    reporterEmail: String(x.reporterEmail ?? ""),
    reason: String(x.reason ?? ""),
    bodyFr: String(x.bodyFr ?? ""),
    bodyAr: String(x.bodyAr ?? ""),
    read: x.read === true,
    createdAt: tsToIso(x.createdAt),
  };
}

export function subscribeAdminNotifications(cb: (items: AdminNotification[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.adminNotifications), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => mapAdminNotificationDoc(d.id, d.data())));
    },
    (err) => {
      console.warn("[adminNotifications]", err.code, err.message);
      cb([]);
    },
  );
}

export async function markAdminNotificationRead(id: string) {
  requireAuthUid();
  await updateDoc(doc(getFirebaseDb(), COL.adminNotifications, id), { read: true });
}

export async function deleteAdminNotification(id: string) {
  requireAuthUid();
  await deleteDoc(doc(getFirebaseDb(), COL.adminNotifications, id));
}

/* ---------- Forum ---------- */

function parseForumUserRole(v: unknown): UserRole {
  if (v === "ADMIN") return "ADMIN";
  if (v === "CITIZEN") return "FARMER";
  if (v === "FARMER") return "FARMER";
  return "FARMER";
}

function mapForumDoc(id: string, x: DocumentData): ForumPost {
  const authorName = String(x.authorName ?? x.authorEmail ?? "?");
  const authorUid = String(x.authorUid ?? "");
  const authorEmail = String(x.authorEmail ?? "");
  const authorRole = parseForumUserRole(x.authorRole);
  const anonymous = x.anonymous === true;
  return {
    id,
    author: authorName,
    authorUid,
    authorEmail,
    authorRole,
    anonymous,
    avatar: String(
      x.avatar ||
        `https://ui-avatars.com/api/?background=10b981&color=fff&name=${encodeURIComponent(authorName)}`,
    ),
    title: String(x.title ?? ""),
    content: String(x.content ?? ""),
    tags: Array.isArray(x.tags) ? x.tags.map(String) : [],
    date: tsToIso(x.createdAt) || new Date().toISOString(),
    likes: Math.max(0, Number(x.likes ?? 0)),
    dislikes: Math.max(0, Number(x.dislikes ?? 0)),
    reports: Number(x.reports ?? 0),
    comments: Array.isArray(x.comments) ? x.comments : [],
  };
}

function mapForumReplyDoc(id: string, x: DocumentData): ForumReplyDoc {
  const pr = x.parentReplyId;
  return {
    id,
    postId: String(x.postId ?? ""),
    parentReplyId: typeof pr === "string" && pr.length > 0 ? pr : null,
    authorUid: String(x.authorUid ?? ""),
    authorName: String(x.authorName ?? ""),
    authorEmail: String(x.authorEmail ?? ""),
    authorRole: parseForumUserRole(x.authorRole),
    anonymous: x.anonymous === true,
    text: String(x.text ?? ""),
    emoji: typeof x.emoji === "string" && x.emoji ? x.emoji : undefined,
    likes: Math.max(0, Number(x.likes ?? 0)),
    dislikes: Math.max(0, Number(x.dislikes ?? 0)),
    createdAt: tsToIso(x.createdAt),
  };
}

export function subscribeForumPosts(cb: (posts: ForumPost[]) => void): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, COL.forumPosts), limit(80));
  return onSnapshot(
    q,
    (snap) => {
      const posts = snap.docs.map((d) => mapForumDoc(d.id, d.data()));
      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      cb(posts.slice(0, 60));
    },
    (err) => {
      console.error("[forumPosts]", err);
      cb([]);
    },
  );
}

export async function createForumPost(input: {
  authorUid: string;
  authorEmail: string;
  authorName: string;
  authorRole: UserRole;
  anonymous: boolean;
  title: string;
  content: string;
  tags: string[];
}) {
  const authUid = requireAuthUid();
  await addDoc(collection(getFirebaseDb(), COL.forumPosts), {
    authorEmail: input.authorEmail,
    authorName: input.authorName,
    authorRole: input.authorRole,
    anonymous: input.anonymous,
    title: input.title,
    content: input.content,
    tags: input.tags,
    authorUid: authUid,
    avatar: "",
    likes: 0,
    dislikes: 0,
    reports: 0,
    comments: [],
    createdAt: serverTimestamp(),
  });
}

/** Vote avec une voix par utilisateur (like / dislike / annulation). */
export async function voteForumPostWithUser(postId: string, userId: string, choice: "like" | "dislike") {
  const db = getFirebaseDb();
  const voteRef = doc(db, COL.forumVotes, `${postId}_${userId}`);
  const postRef = doc(db, COL.forumPosts, postId);
  await runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists()) return;
    const prev = voteSnap.exists() ? (voteSnap.data().type as "like" | "dislike") : null;

    let dLikes = 0;
    let dDislikes = 0;

    if (prev === choice) {
      tx.delete(voteRef);
      if (choice === "like") dLikes = -1;
      else dDislikes = -1;
    } else if (prev === null) {
      tx.set(voteRef, {
        postId,
        userId,
        type: choice,
        createdAt: serverTimestamp(),
      });
      if (choice === "like") dLikes = 1;
      else dDislikes = 1;
    } else {
      tx.update(voteRef, { type: choice });
      if (prev === "like" && choice === "dislike") {
        dLikes = -1;
        dDislikes = 1;
      } else if (prev === "dislike" && choice === "like") {
        dLikes = 1;
        dDislikes = -1;
      }
    }

    if (dLikes !== 0 || dDislikes !== 0) {
      tx.update(postRef, {
        likes: increment(dLikes),
        dislikes: increment(dDislikes),
      });
    }
  });
}

/** @deprecated préférer voteForumPostWithUser */
export async function voteForumPostFirestore(postId: string, type: "like" | "dislike") {
  const field = type === "like" ? "likes" : "dislikes";
  await updateDoc(doc(getFirebaseDb(), COL.forumPosts, postId), { [field]: increment(1) });
}

/** Incrémente les signalements du post et crée une notification lisible par les admins. */
export async function reportForumPostWithAdminNotification(input: {
  postId: string;
  postTitle: string;
  reporterUid: string;
  reporterEmail: string;
  reason: string;
}) {
  const uid = requireAuthUid();
  if (uid !== input.reporterUid) {
    throw new Error("Utilisateur non authentifié.");
  }
  const titleShort = input.postTitle.trim().slice(0, 200);
  const reasonText = input.reason.trim().slice(0, 500) || "Non précisé";
  const reporter = input.reporterEmail.trim() || input.reporterUid;
  const bodyFr = `Signalement forum : la publication « ${titleShort} » a été signalée par ${reporter}. Motif indiqué : ${reasonText}. (ID publication : ${input.postId})`;
  const bodyAr = `تبليغ في المنتدى: تم الإبلاغ عن المنشور « ${titleShort} » من طرف ${reporter}. السبب المذكور: ${reasonText}. (معرف المنشور: ${input.postId})`;

  const db = getFirebaseDb();
  const batch = writeBatch(db);
  batch.update(doc(db, COL.forumPosts, input.postId), { reports: increment(1) });
  const notifRef = doc(collection(db, COL.adminNotifications));
  batch.set(notifRef, {
    type: "forum_post_report",
    postId: input.postId,
    postTitle: titleShort,
    reporterUid: input.reporterUid,
    reporterEmail: input.reporterEmail.trim(),
    reason: reasonText,
    bodyFr: bodyFr.slice(0, 2000),
    bodyAr: bodyAr.slice(0, 2000),
    read: false,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function createForumReply(input: {
  postId: string;
  authorUid: string;
  authorEmail: string;
  authorName: string;
  authorRole: UserRole;
  anonymous: boolean;
  text: string;
  emoji?: string;
  parentReplyId?: string | null;
}) {
  const text = input.text.trim();
  const emojiTrim = (input.emoji ?? "").trim();
  if (!text && !emojiTrim) return;
  const authUid = requireAuthUid();
  const parent = (input.parentReplyId ?? "").trim();
  await addDoc(collection(getFirebaseDb(), COL.forumReplies), {
    postId: input.postId,
    ...(parent ? { parentReplyId: parent } : {}),
    authorUid: authUid,
    authorEmail: input.authorEmail,
    authorName: input.authorName,
    authorRole: input.authorRole,
    anonymous: input.anonymous,
    text,
    ...(emojiTrim ? { emoji: emojiTrim } : {}),
    likes: 0,
    dislikes: 0,
    createdAt: serverTimestamp(),
  });
}

export async function voteForumReplyWithUser(postId: string, replyId: string, userId: string, choice: "like" | "dislike") {
  const db = getFirebaseDb();
  const voteRef = doc(db, COL.forumReplyVotes, `${postId}_${replyId}_${userId}`);
  const replyRef = doc(db, COL.forumReplies, replyId);
  await runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);
    const replySnap = await tx.get(replyRef);
    if (!replySnap.exists()) return;
    if (String(replySnap.data()?.postId ?? "") !== postId) return;
    const prev = voteSnap.exists() ? (voteSnap.data().type as "like" | "dislike") : null;

    let dLikes = 0;
    let dDislikes = 0;

    if (prev === choice) {
      tx.delete(voteRef);
      if (choice === "like") dLikes = -1;
      else dDislikes = -1;
    } else if (prev === null) {
      tx.set(voteRef, {
        postId,
        replyId,
        userId,
        type: choice,
        createdAt: serverTimestamp(),
      });
      if (choice === "like") dLikes = 1;
      else dDislikes = 1;
    } else {
      tx.update(voteRef, { type: choice });
      if (prev === "like" && choice === "dislike") {
        dLikes = -1;
        dDislikes = 1;
      } else if (prev === "dislike" && choice === "like") {
        dLikes = 1;
        dDislikes = -1;
      }
    }

    if (dLikes !== 0 || dDislikes !== 0) {
      tx.update(replyRef, {
        likes: increment(dLikes),
        dislikes: increment(dDislikes),
      });
    }
  });
}

export function subscribeForumRepliesMap(cb: (byPostId: Record<string, ForumReplyDoc[]>) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.forumReplies), orderBy("createdAt", "desc"), limit(500));
  return onSnapshot(
    q,
    (snap) => {
      const byPostId: Record<string, ForumReplyDoc[]> = {};
      snap.docs.forEach((d) => {
        const r = mapForumReplyDoc(d.id, d.data());
        if (!byPostId[r.postId]) byPostId[r.postId] = [];
        byPostId[r.postId].push(r);
      });
      Object.keys(byPostId).forEach((k) => {
        byPostId[k].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      });
      cb(byPostId);
    },
    (err) => {
      console.error("[forumReplies]", err);
      cb({});
    },
  );
}

/** IDs du commentaire `rootId` et de toutes ses réponses imbriquées. */
function collectForumReplySubtreeIds(docs: { id: string; data: () => DocumentData }[], rootId: string): string[] {
  const children = new Map<string, string[]>();
  for (const d of docs) {
    const pr = d.data().parentReplyId;
    const pid = typeof pr === "string" && pr.trim().length > 0 ? pr.trim() : null;
    if (!pid) continue;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid)!.push(d.id);
  }
  const ids: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    ids.push(id);
    for (const cid of children.get(id) ?? []) stack.push(cid);
  }
  return ids;
}

/** Supprime une réponse (racine ou imbriquée), ses sous-réponses et les votes associés. */
export async function deleteForumReplyCascade(postId: string, replyId: string, opts?: { isAdmin?: boolean }) {
  const uid = requireAuthUid();
  const isAdmin = opts?.isAdmin === true;
  const db = getFirebaseDb();
  const repliesSnap = await getDocs(query(collection(db, COL.forumReplies), where("postId", "==", postId)));
  const rootDoc = repliesSnap.docs.find((d) => d.id === replyId);
  if (!rootDoc) return;
  if (String(rootDoc.data().postId ?? "") !== postId) return;

  const subtreeIds = new Set(collectForumReplySubtreeIds(repliesSnap.docs, replyId));
  if (!isAdmin) {
    for (const id of subtreeIds) {
      const d = repliesSnap.docs.find((x) => x.id === id);
      if (d && String(d.data().authorUid ?? "") !== uid) {
        throw new Error("forum_reply_has_other_authors");
      }
    }
  }
  const replyVotesSnap = await getDocs(query(collection(db, COL.forumReplyVotes), where("postId", "==", postId)));
  const voteRefsToDelete = replyVotesSnap.docs
    .filter((d) => subtreeIds.has(String(d.data().replyId ?? "")))
    .map((d) => d.ref);
  const replyRefsToDelete = repliesSnap.docs.filter((d) => subtreeIds.has(d.id)).map((d) => d.ref);
  const refs = [...voteRefsToDelete, ...replyRefsToDelete];
  const chunk = 450;
  for (let i = 0; i < refs.length; i += chunk) {
    const batch = writeBatch(db);
    for (const r of refs.slice(i, i + chunk)) batch.delete(r);
    await batch.commit();
  }
}

export async function deleteForumPostCascade(postId: string) {
  const db = getFirebaseDb();
  const [repliesSnap, votesSnap, replyVotesSnap] = await Promise.all([
    getDocs(query(collection(db, COL.forumReplies), where("postId", "==", postId))),
    getDocs(query(collection(db, COL.forumVotes), where("postId", "==", postId))),
    getDocs(query(collection(db, COL.forumReplyVotes), where("postId", "==", postId))),
  ]);
  const refs = [
    doc(db, COL.forumPosts, postId),
    ...repliesSnap.docs.map((d) => d.ref),
    ...votesSnap.docs.map((d) => d.ref),
    ...replyVotesSnap.docs.map((d) => d.ref),
  ];
  const chunk = 450;
  for (let i = 0; i < refs.length; i += chunk) {
    const batch = writeBatch(db);
    for (const r of refs.slice(i, i + chunk)) batch.delete(r);
    await batch.commit();
  }
}

/* ---------- Réclamations ---------- */

export async function createReclamation(input: { subject: string; body: string; authorUid: string; authorEmail: string }) {
  const authUid = requireAuthUid();
  await addDoc(collection(getFirebaseDb(), COL.reclamations), {
    subject: input.subject,
    body: input.body,
    authorEmail: input.authorEmail,
    authorUid: authUid,
    status: "open",
    createdAt: serverTimestamp(),
  });
}

function mapReclamationDoc(id: string, x: DocumentData): ReclamationDoc {
  return {
    id,
    subject: String(x.subject ?? ""),
    body: String(x.body ?? ""),
    authorUid: String(x.authorUid ?? ""),
    authorEmail: String(x.authorEmail ?? ""),
    status: (x.status === "closed" || x.status === "in_progress" ? x.status : "open") as ReclamationDoc["status"],
    createdAt: tsToIso(x.createdAt),
    adminReply: typeof x.adminReply === "string" ? x.adminReply : undefined,
    adminReplyAt: tsToIso(x.adminReplyAt),
    repliedByUid: typeof x.repliedByUid === "string" ? x.repliedByUid : undefined,
  };
}

export function subscribeMyReclamations(authorUid: string, cb: (rows: ReclamationDoc[]) => void): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), COL.reclamations),
    where("authorUid", "==", authorUid),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapReclamationDoc(d.id, d.data()));
      rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      cb(rows);
    },
    (err) => {
      console.error("[reclamations mine]", err);
      cb([]);
    },
  );
}

export function subscribeReclamations(cb: (rows: ReclamationDoc[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.reclamations), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => mapReclamationDoc(d.id, d.data()));
      rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      cb(rows.slice(0, 100));
    },
    (err) => {
      console.error("[reclamations admin]", err);
      cb([]);
    },
  );
}

export async function updateReclamationStatus(id: string, status: ReclamationDoc["status"]) {
  await updateDoc(doc(getFirebaseDb(), COL.reclamations, id), { status });
}

export async function replyToReclamation(id: string, adminReply: string) {
  const adminUid = requireAuthUid();
  await updateDoc(doc(getFirebaseDb(), COL.reclamations, id), {
    adminReply: adminReply.trim(),
    adminReplyAt: serverTimestamp(),
    repliedByUid: adminUid,
    status: "in_progress",
  });
}

/* ---------- Marketplace ---------- */

export function subscribeMarketplaceProducts(cb: (items: MarketplaceProduct[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.marketplaceProducts), limit(120));
  return onSnapshot(
    q,
    (snap) => {
      const items: MarketplaceProduct[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          sellerUid: String(x.sellerUid ?? ""),
          sellerEmail: String(x.sellerEmail ?? ""),
          sellerName: x.sellerName ? String(x.sellerName) : undefined,
          title: String(x.title ?? ""),
          description: String(x.description ?? ""),
          imageUrl: String(x.imageUrl ?? "").trim(),
          price: Number(x.price ?? 0),
          unit: String(x.unit ?? "DT"),
          quantity: x.quantity ? String(x.quantity) : undefined,
          contactPhone: x.contactPhone ? String(x.contactPhone) : undefined,
          createdAt: tsToIso(x.createdAt),
        };
      });
      items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      cb(items);
    },
    () => {
      cb([]);
    },
  );
}

export async function createMarketplaceProduct(input: {
  sellerUid: string;
  sellerEmail: string;
  sellerName?: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  unit: string;
  quantity?: string;
  contactPhone?: string;
}) {
  const authUid = requireAuthUid();
  const imageUrl = (input.imageUrl ?? "").trim();
  await addDoc(collection(getFirebaseDb(), COL.marketplaceProducts), {
    sellerEmail: input.sellerEmail,
    sellerName: input.sellerName,
    title: input.title,
    description: input.description,
    ...(imageUrl ? { imageUrl } : {}),
    price: input.price,
    unit: input.unit,
    quantity: input.quantity,
    contactPhone: input.contactPhone,
    sellerUid: authUid,
    createdAt: serverTimestamp(),
  });
}

export function subscribeMarketplaceMessages(productId: string, cb: (msgs: MarketplaceMessage[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.marketplaceMessages), where("productId", "==", productId), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          productId: String(x.productId ?? ""),
          senderUid: String(x.senderUid ?? ""),
          senderEmail: String(x.senderEmail ?? ""),
          text: String(x.text ?? ""),
          createdAt: tsToIso(x.createdAt),
        };
      });
      msgs.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
      cb(msgs);
    },
    (err) => {
      console.warn("[marketplaceMessages]", err.code, err.message);
      cb([]);
    },
  );
}

export async function sendMarketplaceMessage(input: { productId: string; senderEmail: string; text: string }) {
  const authUid = requireAuthUid();
  await addDoc(collection(getFirebaseDb(), COL.marketplaceMessages), {
    productId: input.productId,
    senderUid: authUid,
    senderEmail: input.senderEmail,
    text: input.text,
    createdAt: serverTimestamp(),
  });
}

/* ---------- City events (calendrier) ---------- */

function mapCityEventDoc(id: string, x: DocumentData): CityEvent {
  return {
    id,
    title: { fr: String(x.titleFr ?? ""), ar: String(x.titleAr ?? "") },
    date: String(x.date ?? ""),
    imageUrl: String(x.imageUrl ?? "").trim(),
  };
}

export function subscribeCityEvents(cb: (items: CityEvent[]) => void): Unsubscribe {
  const q = query(collection(getFirebaseDb(), COL.cityEvents), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => mapCityEventDoc(d.id, d.data()));
      items.sort((a, b) => b.date.localeCompare(a.date));
      cb(items);
    },
    (err) => {
      console.warn("[cityEvents]", err.code, err.message);
      cb([]);
    },
  );
}

export async function createCityEvent(data: { titleFr: string; titleAr: string; date: string; imageUrl?: string }) {
  const authorUid = requireAuthUid();
  const imageUrl = (data.imageUrl ?? "").trim();
  await addDoc(collection(getFirebaseDb(), COL.cityEvents), {
    titleFr: data.titleFr.trim(),
    titleAr: data.titleAr.trim(),
    date: data.date.trim(),
    ...(imageUrl ? { imageUrl } : {}),
    authorUid,
    createdAt: serverTimestamp(),
  });
}

export async function updateCityEvent(id: string, patch: { titleFr: string; titleAr: string; date: string; imageUrl?: string }) {
  requireAuthUid();
  const imageUrl = (patch.imageUrl ?? "").trim();
  await updateDoc(doc(getFirebaseDb(), COL.cityEvents, id), {
    titleFr: patch.titleFr.trim(),
    titleAr: patch.titleAr.trim(),
    date: patch.date.trim(),
    imageUrl: imageUrl || "",
  });
}

export async function deleteCityEvent(id: string) {
  requireAuthUid();
  await deleteDoc(doc(getFirebaseDb(), COL.cityEvents, id));
}

/* ---------- Installation Requests (Landing Page) ---------- */

import type { InstallationRequest } from "@/models/types";

export async function createInstallationRequest(data: { name: string; email?: string; phone: string; location: string; size: string }) {
  // Allow unauthenticated creation since it's from the landing page.
  const db = getFirebaseDb();
  await addDoc(collection(db, COL.installationRequests), {
    name: data.name.trim(),
    email: data.email?.trim() || "",
    phone: data.phone.trim(),
    location: data.location.trim(),
    size: data.size.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

function mapInstallationRequestDoc(id: string, x: DocumentData): InstallationRequest {
  return {
    id,
    name: String(x.name ?? ""),
    email: x.email ? String(x.email) : undefined,
    phone: String(x.phone ?? ""),
    location: String(x.location ?? ""),
    size: String(x.size ?? ""),
    status: (x.status === "contacted" || x.status === "installed" ? x.status : "pending") as InstallationRequest["status"],
    createdAt: tsToIso(x.createdAt),
  };
}

export function subscribeInstallationRequests(cb: (items: InstallationRequest[]) => void): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(collection(db, COL.installationRequests), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => mapInstallationRequestDoc(d.id, d.data()));
      cb(items);
    },
    (err) => {
      console.warn("[installationRequests]", err.code, err.message);
      cb([]);
    },
  );
}

export async function updateInstallationRequestStatus(id: string, status: InstallationRequest["status"]) {
  requireAuthUid(); // Only admins can update status (handled by role check in component, but requireAuthUid ensures logged in)
  await updateDoc(doc(getFirebaseDb(), COL.installationRequests, id), { status });
}
