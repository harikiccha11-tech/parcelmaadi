import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await req.json();
    const { action, text, context } = body;
    if (!action || !text) return NextResponse.json({ error: "action and text required" }, { status: 400 });

    let systemPrompt = "";
    let userPrompt = "";
    switch (action) {
      case "grammar-fix": systemPrompt = "Fix grammar and spelling. Return ONLY corrected text."; userPrompt = `Fix: ${text}`; break;
      case "rewrite-professional": systemPrompt = "Rewrite professionally for a logistics company. Max 2 sentences. Return ONLY the text."; userPrompt = `Rewrite: ${text}`; break;
      case "improve-title": systemPrompt = "Improve this title to be SEO-friendly. Max 60 chars. Return ONLY the title."; userPrompt = `Improve: ${text}`; break;
      case "seo-title": systemPrompt = "Generate SEO title (max 60 chars). Return ONLY the title."; userPrompt = `For: ${text}`; break;
      case "meta-description": systemPrompt = "Generate meta description (max 155 chars). Return ONLY the description."; userPrompt = `For: ${text}`; break;
      case "keywords": systemPrompt = "Generate 5-10 keywords as comma-separated list. Return ONLY keywords."; userPrompt = `For: ${text}`; break;
      case "suggest-category": systemPrompt = "Suggest best e-commerce category. Return ONLY category name."; userPrompt = `For: ${text}`; break;
      case "marketing-description": systemPrompt = "Write compelling marketing description (2-3 sentences). Return ONLY the text."; userPrompt = `For: ${text}`; break;
      case "alt-text": systemPrompt = "Generate image alt text (max 125 chars). Return ONLY alt text."; userPrompt = `For: ${text}`; break;
      default: return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let aiResponse = "";
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages: [{ role: "assistant", content: systemPrompt }, { role: "user", content: userPrompt }],
        thinking: { type: "disabled" },
      });
      aiResponse = completion.choices[0]?.message?.content?.trim() || "";
    } catch {
      aiResponse = text; // fallback
    }

    return NextResponse.json({ action, input: text, result: aiResponse, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "AI failed" }, { status: 500 });
  }
}
