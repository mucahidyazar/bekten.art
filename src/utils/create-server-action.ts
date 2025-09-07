import type { z } from "zod";

// Hata tipi (validation & server)
export type ActionError = {
  type: "validation" | "server";
  message: string;
  // Zod validation detayları (varsa)
  issues?: Array<{ path: (string | number)[]; message: string }>;
  // Orijinal hata referansı (loglamak için)
  cause?: unknown;
};

type HandlerCtx<TInput> = { input: TInput };

// Server action wrapper - bu fonksiyon server action'ları oluşturmak için kullanılır
export function createServerAction<TSchema extends z.ZodTypeAny, TReturn>(
  schema: TSchema,
  handlerFn: (ctx: HandlerCtx<z.infer<TSchema>>) => Promise<TReturn> | TReturn
): (input: z.infer<TSchema>) => Promise<[TReturn | null, ActionError | null]> {
  // Bu fonksiyon server action dosyalarında kullanılacak
  return async function action(input: z.infer<TSchema>): Promise<[TReturn | null, ActionError | null]> {
    // Debug: input'u log'la
    console.log('createServerAction received input:', input);

    // 1) Zod ile doğrulama
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      console.error('Zod validation failed:', parsed.error);
      console.error('Validation issues:', parsed.error.issues);

      return [
        null,
        {
          type: "validation",
          message: "Invalid input",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.filter((p): p is string | number => typeof p === "string" || typeof p === "number"),
            message: i.message,
          })),
        },
      ] as [TReturn | null, ActionError | null];
    }

    // 2) Handler çalıştırma (try/catch)
    try {
      const result = await handlerFn({ input: parsed.data });

      return [result, null];
    } catch (e: any) {
      return [
        null,
        {
          type: "server",
          message: e?.message ?? "Unexpected server error",
          cause: e,
        },
      ];
    }
  };
}
