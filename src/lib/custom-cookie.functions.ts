import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomCookieSchema = z.object({
  nome: z.string().min(2).max(60),
  descricao: z.string().min(10).max(280),
  preco_sugerido: z.number().min(5).max(80),
  emoji: z.string().max(4),
});

export type CustomCookie = z.infer<typeof CustomCookieSchema>;

const InputSchema = z.object({
  base: z.string().min(1).max(60),
  recheio: z.string().max(60).optional().default(""),
  cobertura: z.string().max(60).optional().default(""),
  extras: z.string().max(120).optional().default(""),
});

export const buildCustomCookie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<CustomCookie> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente no servidor");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = [
      `Base: ${data.base}`,
      data.recheio && `Recheio: ${data.recheio}`,
      data.cobertura && `Cobertura: ${data.cobertura}`,
      data.extras && `Extras: ${data.extras}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({ schema: CustomCookieSchema }),
        system:
          "Você cria cookies artesanais personalizados para uma cookieria brasileira. " +
          "Dado os ingredientes escolhidos pelo cliente, invente um nome criativo, " +
          "uma descrição curta e apetitosa (até 200 caracteres), um preço sugerido em reais " +
          "(entre R$8 e R$35 conforme complexidade) e um emoji que combine com o cookie.",
        prompt,
      });
      return experimental_output;
    } catch (err: unknown) {
      const e = err as { statusCode?: number; status?: number; message?: string };
      const status = e.statusCode ?? e.status;
      if (status === 429) throw new Error("Muitas pessoas montando cookies agora. Tente novamente em instantes.");
      if (status === 402) throw new Error("Créditos de IA esgotados.");
      throw new Error(e.message ?? "Falha ao montar cookie");
    }
  });
