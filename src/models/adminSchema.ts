import type { AdminEventSync } from "./types";

export function buildAdminEventSync(): AdminEventSync {
  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    sender: {
      role: "AGRICULTURAL_OFFICE",
      id: "GOV-GABS-01",
      department: "Direction Régionale de Gabès",
    },
    event: {
      type: "ALERT",
      id: "EVT-2026-04-18",
      title: {
        ar: "تحذير: ذبابة الفاكهة",
        fr: "Alerte: Mouche des fruits",
      },
      description: {
        ar: "تم رصد نشاط مكثف لذبابة الفاكهة في واحات شنني. يرجى تفعيل بروتوكول الوقاية.",
        fr: "Une activité intense de la mouche des fruits a été détectée dans les oasis de Chenini. Veuillez activer le protocole de prévention.",
      },
      priority: "HIGH",
      targetAudience: ["FARMER"],
      validUntil: "2026-04-25T23:59:59Z",
      actions: [
        {
          label: { ar: "دليل الوقاية", fr: "Guide de prévention" },
          url: "https://agri.tn/guides/pests/fruit-fly",
        },
      ],
    },
    metadata: {
      region: "GABES",
      tags: ["irrigation", "pomegranate", "pest-control"],
    },
  };
}
