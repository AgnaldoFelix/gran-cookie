import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CookieSchema = z.object({
  nome: z.string().min(2).max(60),
  descricao: z.string().min(10).max(280),
  preco: z.number().min(1).max(200),
  categoria: z.string().min(2).max(40),
  tags: z.array(z.string().min(1).max(20)).min(1).max(6),
});

export type AiCookieDraft = z.infer<typeof CookieSchema>;

const InputSchema = z.object({
  prompt: z.string().trim().min(3, "Descreva o cookie em pelo menos 3 caracteres").max(300),
});

export const generateCookieDraft = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AiCookieDraft> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: CookieSchema }),
        system:
          "Você é especialista em produtos para uma cookieria artesanal brasileira. " +
          "Gere um cookie irresistível com base na ideia do usuário. " +
          "Preço em reais (R$), descrição curta e apetitosa, categoria simples " +
          "(ex.: Clássicos, Especiais, Saudáveis, Recheados, Sem Glúten). " +
          "Tags em minúsculas, sem acento, separadas (ex.: chocolate, recheado).",
        prompt: `Ideia: ${data.prompt}`,
      });
      return experimental_output;
    } catch (err: unknown) {
      const e = err as { statusCode?: number; status?: number; message?: string };
      const status = e.statusCode ?? e.status;
      if (status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(e.message ?? "Falha ao gerar cookie com IA");
    }
  });
