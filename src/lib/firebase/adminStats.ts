import { collection, getCountFromServer } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { COL } from "@/lib/firebase/collections";

export type AdminDashboardStats = {
  users: number;
  news: number;
  reclamations: number;
  forumPosts: number;
  marketplaceProducts: number;
};

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const db = getFirebaseDb();
  const [users, news, reclamations, forumPosts, marketplaceProducts] = await Promise.all([
    getCountFromServer(collection(db, COL.users)),
    getCountFromServer(collection(db, COL.news)),
    getCountFromServer(collection(db, COL.reclamations)),
    getCountFromServer(collection(db, COL.forumPosts)),
    getCountFromServer(collection(db, COL.marketplaceProducts)),
  ]);
  return {
    users: users.data().count,
    news: news.data().count,
    reclamations: reclamations.data().count,
    forumPosts: forumPosts.data().count,
    marketplaceProducts: marketplaceProducts.data().count,
  };
}
