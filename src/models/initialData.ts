import type { CityEvent, ForumPost } from "./types";

const demoAuthor = { authorEmail: "", authorRole: "FARMER" as const, anonymous: false };

export const initialEvents: CityEvent[] = [
  { id: "1", title: { fr: "Festival de la Grenade", ar: "مهرجان الرمان" }, date: "2026-10-25", imageUrl: "" },
  { id: "2", title: { fr: "Rencontre Agricole", ar: "لقاء فلاحي" }, date: "2026-05-12", imageUrl: "" },
];

export const initialForumPosts: ForumPost[] = [
  {
    id: "1",
    author: "Mohamed G.",
    authorUid: "",
    ...demoAuthor,
    avatar: "https://picsum.photos/seed/user1/100/100",
    title: "Besoin de volontaires pour le nettoyage de l'oasis",
    content:
      "Nous organisons une journée de nettoyage ce dimanche aux abords de l'oasis de Chenini. Venez nombreux avec vos outils !",
    tags: ["#Oasis", "#Environnement"],
    date: "2026-04-18T09:00:00Z",
    likes: 42,
    dislikes: 2,
    reports: 0,
    comments: [
      {
        id: "c1",
        author: "Sami B.",
        text: "Je serai là avec mon équipe ! Super initiative.",
        date: "2026-04-18T10:00:00Z",
        replies: [
          {
            id: "r1",
            author: "Mohamed G.",
            text: "Génial, merci Sami !",
            date: "2026-04-18T10:30:00Z",
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    author: "Fatma K.",
    authorUid: "",
    ...demoAuthor,
    avatar: "https://picsum.photos/seed/user2/100/100",
    title: "Nouveau point de collecte de déchets plastiques",
    content:
      "Un nouveau bac a été installé près du marché. Utilisons-le pour garder Gabès propre.",
    tags: ["#Collecte", "#GabèsPropre"],
    date: "2026-04-17T15:00:00Z",
    likes: 128,
    dislikes: 1,
    reports: 0,
    comments: [],
  },
];
