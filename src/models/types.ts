/**
 * Admin to Citizen Event Synchronization Schema
 */
export interface AdminEventSync {
  version: string;
  timestamp: string;
  sender: {
    role: "ADMIN" | "GOVERNMENT" | "AGRICULTURAL_OFFICE";
    id: string;
    department: string;
  };
  event: {
    type: "ALERT" | "ANNOUNCEMENT" | "MARKET_UPDATE" | "WEATHER_WARNING";
    id: string;
    title: {
      ar: string;
      fr: string;
    };
    description: {
      ar: string;
      fr: string;
    };
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    targetAudience: ("FARMER" | "CITIZEN" | "INDUSTRY")[];
    validUntil?: string;
    actions?: {
      label: { ar: string; fr: string };
      url: string;
    }[];
  };
  metadata: {
    region: "GABES" | "TUNISIA";
    tags: string[];
  };
}

export type Message = {
  role: "user" | "model";
  text: string;
};

export interface PostComment {
  id: string;
  author: string;
  text: string;
  date: string;
  replies: PostComment[];
}

export type UserRole = "CITIZEN" | "FARMER" | "ADMIN";

export interface ForumPost {
  id: string;
  author: string;
  authorUid: string;
  /** E-mail stocké (affiché seulement si non anonyme ou si admin). */
  authorEmail: string;
  authorRole: UserRole;
  anonymous: boolean;
  avatar: string;
  title: string;
  content: string;
  tags: string[];
  date: string;
  likes: number;
  dislikes: number;
  /** @deprecated préférer forumReplies Firestore */
  comments: PostComment[];
  reports: number;
}

/** Réponse / commentaire sur un post forum (collection forumReplies). */
export type ForumReplyDoc = {
  id: string;
  postId: string;
  /** Si défini : réponse à un autre commentaire (niveau 2). */
  parentReplyId?: string | null;
  authorUid: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  anonymous: boolean;
  text: string;
  emoji?: string;
  likes: number;
  dislikes: number;
  createdAt: string | null;
};

/** Profils accessibles depuis l’écran de connexion (hors administration) — uniquement agriculteur. */
export type PublicUserRole = "FARMER";

/** Connexion Google sans document Firestore : choix du rôle à compléter. */
export type GoogleProfilePending = {
  uid: string;
  email: string;
  phone?: string;
  address?: string;
};

/** Champs profil optionnels (inscription / édition). */
export type UserProfileExtras = {
  phone?: string;
  address?: string;
  displayName?: string;
};

/** Article news publié par l’admin (Firestore). */
export type NewsArticle = {
  id: string;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  /** URL d’image (optionnelle), ex. hébergement externe ou Storage. */
  imageUrl: string;
  createdAt: string | null;
  authorUid: string;
};

/** Notification réservée à l’admin (ex. signalement forum). */
export type AdminNotification = {
  id: string;
  type: "forum_post_report";
  postId: string;
  postTitle: string;
  reporterUid: string;
  reporterEmail: string;
  reason: string;
  bodyFr: string;
  bodyAr: string;
  read: boolean;
  createdAt: string | null;
};

/** Réclamation citoyenne (Firestore). */
export type ReclamationDoc = {
  id: string;
  subject: string;
  body: string;
  authorUid: string;
  authorEmail: string;
  status: "open" | "in_progress" | "closed";
  createdAt: string | null;
  /** Réponse visible par le citoyen */
  adminReply?: string;
  adminReplyAt?: string | null;
  repliedByUid?: string;
};

/** Produit marketplace (Firestore). */
export type MarketplaceProduct = {
  id: string;
  sellerUid: string;
  sellerEmail: string;
  sellerName?: string;
  title: string;
  description: string;
  /** URL image produit (optionnel). */
  imageUrl: string;
  price: number;
  unit: string;
  quantity?: string;
  contactPhone?: string;
  createdAt: string | null;
};

/** Message négociation lié à un produit. */
export type MarketplaceMessage = {
  id: string;
  productId: string;
  senderUid: string;
  senderEmail: string;
  text: string;
  createdAt: string | null;
};

export type Lang = "fr" | "ar";

export interface CityEvent {
  id: string;
  title: { fr: string; ar: string };
  date: string;
  /** URL image (optionnel). */
  imageUrl: string;
}

/** Demande d'installation soumise depuis la page d'accueil (Landing Page). */
export interface InstallationRequest {
  id: string;
  name: string;
  email?: string;
  phone: string;
  location: string;
  size: string;
  status: "pending" | "contacted" | "installed";
  createdAt: string | null;
}
