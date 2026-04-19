import { ApiError, GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import type { Message } from "@/models/types";
import { verifyFirebaseIdToken } from "@/lib/server/firebaseIdToken";
import { rateLimitHit } from "@/lib/server/rateLimitMemory";

/**
 * Consigne système : réponses **uniquement en arabe tunisien (تونسي / derja)** + périmètre agriculture.
 */
const SYSTEM_INSTRUCTION = `Tu es "اسألني" (Ask me), l’assistant agricole officiel de la plateforme « Gabes bin ydik » (ڤَابس بين يديك) — Gabès, Tunisie.

RÈGLE ABSOLUE — PÉRIMÈTRE (أهم قاعدة) :
- Tu ne réponds **QUE** aux questions **directement liées à l’agriculture** : cultures (شجير، خضار، حبوب، أشجار مثمرة…)، تربة، ريّ، ماء في السياق الفلاحي، تسميد، آفات وأمراض النباتات، أدوات ومعدات **للحقل/الواحة**، تربية حيوانات **في إطار فلاحي** (رعي، علف، مزرعة)، تخزين المحاصيل، تسويق **محصول**، تقويم زراعي، فلاحة بيئية، ملوحة/تلوث **يخصّ الأرض أو الريّ**، أسئلة تقنية على **محصول أو شجرة أو مزرعة**.
- Si la question est **hors agriculture** (code, jeux, politique générale, santé humaine, droit, devoirs scolaires non agricoles, blagues, météo générale sans ربط بالمحصول, sport, cuisine ménagère, tech grand public…), tu **refuses poliment** : **2–4 phrases maximum**, en **arabe tunisien uniquement** (مش بالفرنساوي)، sans détails ni leçon. Dis que المساعدة هذي للفلاحة فقط مع ڤَابس بين يديك.
- Si le sujet est **flou** mais pourrait être agricole, pose **une seule** question courte pour clarifier le lien avec la culture / المزرعة / الشجرة / الريّ avant de développer.
- Ne détourne pas un hors-sujet vers la agriculture : un refus net et courtois suffit.

LANGUE (règle stricte — أهم من الفرنساوي) :
- Tu réponds **toujours en arabe tunisien (تونسي / derja)** : langue parlée locale, naturelle, chaude. **Même** si l’utilisateur écrit en **français** ou en **anglais**, tu **traduiras** ta réponse en tunisien (tu peux reprendre un mot rare du message entre guillemets si indispensable, mais **pas** de phrases entières en français).
- **Interdit** : répondre en français, en anglais ou en arabe littéraire soutenu (فصحى) sauf **un seul** terme technique ponctuel (nom latin de parasite, unité SI) entre parenthèses si vraiment nécessaire.
- Utilise des tournures tunisiennes (مثلاً: كيفاش، علاش، باش، نجم، ما، شنوة، وين، عندك، حاجة، برشا، شوية، اليوم، الدنيا، ياخي، الخ…).
- Si l’utilisateur mélange français et tunisien : réponse **100 % tunisien**.

Rôle (dans le périmètre agricole) : conseiller sur l’**agriculture** en zone **oasienne et semi-aride**, en priorité **Gabès / الجنوب التونسي**.

Expertise (prioritaire) :
- Grenade (رمان قابسي Gabsi)، نخيل، زيتون، خضار الواحة، أشجار مثمرة.
- الماء والريّ : توفير الماء، التنقيط، الملوحة، الإجهاد المائي، الشبكات.
- التربة والتسميد : أعراض الأوراق، العناصر، السماد العضوي والمعدني، الدورات.
- المناخ المحلي **للقرار الفلاحي** : حر، جفاف، رياح، تقويم زراعي، تظليل، تغطية التربة.
- الآفات والأمراض : علامات، وقاية، توجيه نحو مهندس فلاحي إذا الحالة خطيرة أو غير مؤكدة.
- فلاحة أكثر احتراماً للماء والبيئة في الواحات.

Style (quand tu réponds sur l’agriculture) :
- Concret, étapes simples، بدون تعقيد؛ إذا ينقصك معلومة (الصنف، مرحلة النمو)، اسأل 1–3 أسئلة قصيرة.

Limites :
- Pas de chiffres météo ou prix du marché présentés comme certains sans les qualifier d’estimation.
- Situations sanitaires graves ou douteuses : orienter vers un ingénieur agronome ou les services compétents.`;

const MAX_MESSAGES = 32;
const MAX_TEXT_PER_MESSAGE = 8000;

const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"] as const;

const isAuthEmulator = () => process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";

function normalizeMessages(messages: Message[]): Message[] {
  const trimmed = messages
    .filter((m) => typeof m.text === "string" && m.text.trim().length > 0)
    .map((m) => ({
      ...m,
      text: m.text.trim().slice(0, MAX_TEXT_PER_MESSAGE),
    }));
  while (trimmed.length > 0 && trimmed[0].role !== "user") {
    trimmed.shift();
  }
  if (trimmed.length === 0) return [];
  const capped = trimmed.length > MAX_MESSAGES ? trimmed.slice(-MAX_MESSAGES) : trimmed;
  return mergeConsecutiveRoles(capped);
}

function mergeConsecutiveRoles(messages: Message[]): Message[] {
  const out: Message[] = [];
  for (const m of messages) {
    const last = out[out.length - 1];
    if (last && last.role === m.role) {
      last.text = `${last.text}\n\n${m.text}`;
    } else {
      out.push({ role: m.role, text: m.text });
    }
  }
  return out;
}

function extractTextFromResponse(response: { text?: string; candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[] }): string {
  const direct = response.text?.trim();
  if (direct) return direct;
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  let acc = "";
  for (const p of parts) {
    if (typeof p.text === "string" && p.text.length > 0 && p.thought !== true) acc += p.text;
  }
  return acc.trim();
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterChatResponse = {
  choices?: { message?: { content?: string | null; role?: string } }[];
  error?: { message?: string; code?: number };
};

/** OpenRouter (clé `sk-or-v1-…`) — format messages compatible OpenAI. */
async function chatWithOpenRouter(messages: Message[], apiKey: string): Promise<{ text: string; httpStatus: number; errBody?: string }> {
  const model = process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";
  const referer = process.env.APP_URL?.trim() || "http://localhost:3030";
  const openaiMessages = [
    { role: "system" as const, content: SYSTEM_INSTRUCTION },
    ...messages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    })),
  ];

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "Gabes bin ydik",
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      temperature: 0.55,
      max_tokens: 2048,
    }),
  });

  const raw = await res.text();
  let data: OpenRouterChatResponse = {};
  try {
    data = JSON.parse(raw) as OpenRouterChatResponse;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg = data.error?.message ?? raw.slice(0, 400);
    return { text: "", httpStatus: res.status, errBody: msg };
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { text, httpStatus: 200 };
}

async function assertAuthorizedChat(request: Request): Promise<NextResponse | null> {
  // Extract IP for rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local_user";
  
  // Rate limiting par IP pour tout le monde (connecté ou non)
  const rl = rateLimitHit(`chat:ip:${ip}`, 45, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited", detail: String(rl.retryAfterSec ?? 60) }, { status: 429 });
  }

  // L'API Chat est désormais publique (sans authentification stricte)
  // Cela permet à la Landing Page d'utiliser le Chatbot.
  return null;
}

export async function POST(request: Request) {
  const authErr = await assertAuthorizedChat(request);
  if (authErr) return authErr;

  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!openRouterKey && !geminiKey) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
    }

    const body = (await request.json()) as { messages?: Message[] };
    const raw = body.messages ?? [];
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: "invalid_messages" }, { status: 400 });
    }

    const messages = normalizeMessages(raw);
    if (messages.length === 0) {
      return NextResponse.json({ error: "invalid_messages" }, { status: 400 });
    }

    if (openRouterKey) {
      const { text, httpStatus, errBody } = await chatWithOpenRouter(messages, openRouterKey);
      if (text) {
        return NextResponse.json({ text });
      }
      if (httpStatus === 401 || httpStatus === 403) {
        return NextResponse.json(
          { error: "llm_failed", detail: (errBody ?? "unauthorized").slice(0, 400), hint: "invalid_api_key" },
          { status: 502 },
        );
      }
      return NextResponse.json(
        { error: "llm_failed", detail: (errBody ?? "empty_response").slice(0, 500) },
        { status: 502 },
      );
    }

    const genAI = new GoogleGenAI({ apiKey: geminiKey! });
    const preferred = process.env.GEMINI_API_MODEL?.trim();
    const modelOrder = preferred
      ? [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)]
      : [...MODEL_FALLBACKS];

    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    let lastErr = "unknown";
    for (const model of modelOrder) {
      try {
        const response = await genAI.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.55,
            maxOutputTokens: 2048,
          },
        });
        const text = extractTextFromResponse(response);
        if (text) {
          return NextResponse.json({ text });
        }
        lastErr = `empty_response (${model})`;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        if (err instanceof ApiError && err.status === 404) {
          continue;
        }
        break;
      }
    }

    return NextResponse.json({ error: "llm_failed", detail: lastErr.slice(0, 500) }, { status: 502 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    const hint =
      e instanceof ApiError && (e.status === 401 || e.status === 403)
        ? "invalid_api_key"
        : e instanceof ApiError && e.status === 429
          ? "rate_limited"
          : undefined;
    return NextResponse.json(
      { error: "llm_failed", detail: msg.slice(0, 400), hint },
      { status: 502 },
    );
  }
}
