"use client";

import { useEffect, useState } from "react";
import { Store, Plus, MessageCircle, X, Loader2, Send, ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import {
  createMarketplaceProduct,
  sendMarketplaceMessage,
  subscribeMarketplaceMessages,
  subscribeMarketplaceProducts,
} from "@/lib/firebase/appContentRepos";
import type { MarketplaceMessage, MarketplaceProduct } from "@/models/types";

function validateProduct(
  title: string,
  description: string,
  priceStr: string,
  unit: string,
  quantity: string,
  contactPhone: string,
  t: (fr: string, ar: string) => string,
): Partial<Record<"title" | "description" | "price" | "unit" | "quantity" | "contactPhone", string>> | null {
  const err: Partial<Record<"title" | "description" | "price" | "unit" | "quantity" | "contactPhone", string>> = {};
  if (title.trim().length < 2) err.title = t("Titre trop court.", "عنوان قصير.");
  if (title.trim().length > 120) err.title = t("Titre trop long (120 max).", "عنوان طويل جداً.");
  if (description.trim().length < 5) err.description = t("Description trop courte (5 car. min).", "وصف قصير جداً.");
  if (description.trim().length > 2000) err.description = t("Description trop longue.", "وصف طويل جداً.");
  const price = parseFloat(priceStr.replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) err.price = t("Prix invalide (> 0).", "سعر غير صالح.");
  if (price > 1_000_000) err.price = t("Prix trop élevé.", "سعر مرتفع جداً.");
  const u = unit.trim();
  if (u.length < 1 || u.length > 24) err.unit = t("Unité invalide (ex. DT/kg).", "وحدة غير صالحة.");
  if (quantity.trim().length > 0) {
    const qn = parseFloat(quantity.replace(",", "."));
    if (!Number.isFinite(qn) || qn < 0) err.quantity = t("Quantité invalide.", "كمية غير صالحة.");
  }
  const ph = contactPhone.trim();
  if (ph.length > 0 && ph.replace(/\D/g, "").length < 8) {
    err.contactPhone = t("Téléphone invalide (8 chiffres min).", "هاتف غير صالح.");
  }
  return Object.keys(err).length ? err : null;
}

export function FarmerMarketplace({
  t,
  userUid,
  userEmail,
}: {
  t: (fr: string, ar: string) => string;
  userUid: string;
  userEmail: string | null;
}) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("DT/kg");
  const [quantity, setQuantity] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"title" | "description" | "price" | "unit" | "quantity" | "contactPhone", string>>
  >({});

  useEffect(() => {
    return subscribeMarketplaceProducts(setProducts);
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    return subscribeMarketplaceMessages(selected.id, setMessages);
  }, [selected?.id]);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setFieldErrors({});
    const ve = validateProduct(title, description, price, unit, quantity, contactPhone, t);
    if (ve) {
      setFieldErrors(ve);
      return;
    }
    const priceNum = parseFloat(price.replace(",", "."));
    setCreating(true);
    try {
      await createMarketplaceProduct({
        sellerUid: userUid,
        sellerEmail: userEmail ?? "",
        sellerName: userEmail?.split("@")[0],
        title: title.trim(),
        description: description.trim(),
        imageUrl: productImageUrl.trim() || undefined,
        price: priceNum,
        unit: unit.trim() || "DT",
        quantity: quantity.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setContactPhone("");
      setProductImageUrl("");
      setUnit("DT/kg");
      setShowAdd(false);
    } catch (e) {
      console.error(e);
      setCreateError(t("Échec de la publication. Vérifiez la connexion et les règles Firestore.", "فشل النشر. تحقق من الاتصال."));
    } finally {
      setCreating(false);
    }
  }

  async function sendMsg() {
    if (!selected || !msgText.trim()) return;
    const text = msgText.trim();
    if (text.length > 2000) return;
    setSending(true);
    try {
      await sendMarketplaceMessage({
        productId: selected.id,
        senderEmail: userEmail ?? "",
        text,
      });
      setMsgText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">{t("Marketplace", "السوق")}</h2>
          <p className="text-zinc-500 font-bold text-sm mt-1">{t("Publiez vos produits et échangez avec d’autres agriculteurs.", "انشر منتجاتك وتواصل مع الفلاحين.")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setCreateError(null);
            setFieldErrors({});
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg"
        >
          <Plus size={18} />
          {t("Ajouter un produit", "إضافة منتج")}
        </button>
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <form onSubmit={addProduct} className="w-full max-w-md bg-white rounded-3xl border border-zinc-100 shadow-2xl p-8 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-zinc-900 uppercase text-sm">{t("Nouveau produit", "منتج جديد")}</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-zinc-100">
                <X size={20} />
              </button>
            </div>
            {createError ? <p className="text-xs font-bold text-red-600">{createError}</p> : null}
            <div>
              <input
                placeholder={t("Titre", "العنوان")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFieldErrors((f) => ({ ...f, title: undefined }));
                }}
                maxLength={120}
                className={cn("w-full rounded-xl border px-3 py-2 text-sm font-bold", fieldErrors.title ? "border-red-300" : "border-zinc-200")}
              />
              {fieldErrors.title ? <p className="text-[10px] text-red-600 mt-1">{fieldErrors.title}</p> : null}
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1 mb-1">
                <ImageIcon size={12} />
                {t("Photo (URL)", "صورة (رابط)")}
              </label>
              <input
                type="text"
                value={productImageUrl}
                onChange={(e) => setProductImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
              />
            </div>
            <div>
              <textarea
                placeholder={t("Description", "الوصف")}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((f) => ({ ...f, description: undefined }));
                }}
                rows={3}
                maxLength={2000}
                className={cn("w-full rounded-xl border px-3 py-2 text-sm font-bold resize-none", fieldErrors.description ? "border-red-300" : "border-zinc-200")}
              />
              {fieldErrors.description ? <p className="text-[10px] text-red-600 mt-1">{fieldErrors.description}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={t("Prix", "السعر")}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setFieldErrors((f) => ({ ...f, price: undefined }));
                  }}
                  className={cn("rounded-xl border px-3 py-2 text-sm font-bold w-full", fieldErrors.price ? "border-red-300" : "border-zinc-200")}
                />
                {fieldErrors.price ? <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.price}</p> : null}
              </div>
              <div>
                <input
                  placeholder={t("Unité (DT/kg)", "الوحدة")}
                  value={unit}
                  onChange={(e) => {
                    setUnit(e.target.value);
                    setFieldErrors((f) => ({ ...f, unit: undefined }));
                  }}
                  maxLength={24}
                  className={cn("rounded-xl border px-3 py-2 text-sm font-bold w-full", fieldErrors.unit ? "border-red-300" : "border-zinc-200")}
                />
                {fieldErrors.unit ? <p className="text-[10px] text-red-600 mt-0.5">{fieldErrors.unit}</p> : null}
              </div>
            </div>
            <div>
              <input
                placeholder={t("Quantité / stock", "الكمية")}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFieldErrors((f) => ({ ...f, quantity: undefined }));
                }}
                className={cn("w-full rounded-xl border px-3 py-2 text-sm font-bold", fieldErrors.quantity ? "border-red-300" : "border-zinc-200")}
              />
              {fieldErrors.quantity ? <p className="text-[10px] text-red-600 mt-1">{fieldErrors.quantity}</p> : null}
            </div>
            <div>
              <input
                type="tel"
                inputMode="tel"
                placeholder={t("Tél. contact", "هاتف للتواصل")}
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  setFieldErrors((f) => ({ ...f, contactPhone: undefined }));
                }}
                maxLength={32}
                className={cn("w-full rounded-xl border px-3 py-2 text-sm font-bold", fieldErrors.contactPhone ? "border-red-300" : "border-zinc-200")}
              />
              {fieldErrors.contactPhone ? <p className="text-[10px] text-red-600 mt-1">{fieldErrors.contactPhone}</p> : null}
            </div>
            <button type="submit" disabled={creating} className="w-full py-3 rounded-xl bg-zinc-900 text-white text-xs font-black uppercase disabled:opacity-50 flex justify-center gap-2">
              {creating ? <Loader2 className="animate-spin" size={18} /> : null}
              {t("Publier", "نشر")}
            </button>
          </form>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {products.length === 0 ? (
            <p className="text-sm font-bold text-zinc-500 py-8 text-center rounded-2xl bg-white/50 border border-white">{t("Aucun produit.", "لا منتجات.")}</p>
          ) : (
            products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full text-left p-6 rounded-[2rem] border transition-all shadow-sm",
                  selected?.id === p.id ? "bg-white border-emerald-400 ring-2 ring-emerald-200" : "bg-white/50 border-white hover:bg-white/80",
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border border-zinc-100 shrink-0" />
                    ) : (
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                        <Store size={22} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-black text-zinc-900 uppercase">{p.title}</h4>
                      <p className="text-xs text-zinc-500 font-medium line-clamp-2 mt-1">{p.description}</p>
                      <p className="text-sm font-black text-emerald-700 mt-2">
                        {p.price} {p.unit}
                        {p.quantity ? ` · ${p.quantity}` : ""}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1">{p.sellerEmail}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-[2rem] bg-white/70 border border-white p-6 shadow-sm min-h-[420px] flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="text-emerald-600" size={22} />
                <h3 className="font-black text-zinc-900 uppercase text-sm">{t("Discussion", "محادثة")}</h3>
              </div>
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt="" className="w-full max-h-40 object-cover rounded-2xl border border-zinc-100 mb-3" />
              ) : null}
              <p className="text-xs text-zinc-500 font-bold mb-4">{selected.title}</p>
              {selected.contactPhone ? (
                <p className="text-xs font-black text-emerald-700 mb-2">
                  {t("Contact vendeur", "اتصال البائع")}: {selected.contactPhone}
                </p>
              ) : null}
              <div className="flex-1 overflow-y-auto space-y-3 max-h-72 mb-4 pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "p-3 rounded-xl text-xs font-medium max-w-[90%]",
                      m.senderUid === userUid ? "bg-emerald-600 text-white ml-auto" : "bg-zinc-100 text-zinc-800",
                    )}
                  >
                    <p className="text-[9px] font-black opacity-70 mb-1">{m.senderEmail}</p>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-auto">
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder={t("Proposer / négocier…", "اقتراح أو تفاوض…")}
                  maxLength={2000}
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void sendMsg())}
                />
                <button type="button" disabled={sending || !msgText.trim()} onClick={sendMsg} className="p-3 rounded-xl bg-zinc-900 text-white disabled:opacity-40">
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold text-zinc-400 m-auto text-center py-20">{t("Sélectionnez un produit pour discuter.", "اختر منتجاً للمحادثة.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
