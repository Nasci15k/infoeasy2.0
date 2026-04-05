import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getApisBySearchType, validateCPF, validateCNPJ, validateEmail, validatePhone, validatePlate, validateCEP } from "./apis";
import { saveSearchQuery, getUserSearchHistory } from "./db";
import { searchAdvancedRouter } from "./search-advanced";

/**
 * Helper function to call external APIs
 */
async function callExternalAPI(endpoint: string, paramName: string, paramValue: string): Promise<unknown> {
  try {
    const url = new URL(endpoint);
    url.searchParams.set(paramName, paramValue);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Nasci15k-Search/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      return { raw: text, error: "Failed to parse JSON response" };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`API call timeout for ${endpoint}`);
    }
    console.error(`[API Call] Error calling ${endpoint}:`, error);
    throw error;
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Search procedures (original)
   */
  search: router({
    /**
     * Search by CPF
     */
    byCpf: publicProcedure
      .input(z.object({ cpf: z.string().min(11) }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { cpf } = input;

        if (!validateCPF(cpf)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CPF inválido",
          });
        }

        const cleanCpf = cpf.replace(/\D/g, "");
        const apis = getApisBySearchType("cpf");

        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, cleanCpf);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "cpf",
            searchValue: cleanCpf,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Search by Email
     */
    byEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { email } = input;

        if (!validateEmail(email)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email inválido",
          });
        }

        const apis = getApisBySearchType("email");
        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, email);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "email",
            searchValue: email,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Search by Phone
     */
    byPhone: publicProcedure
      .input(z.object({ phone: z.string().min(10) }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { phone } = input;

        if (!validatePhone(phone)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Telefone inválido",
          });
        }

        const cleanPhone = phone.replace(/\D/g, "");
        const apis = getApisBySearchType("phone");
        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, cleanPhone);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "phone",
            searchValue: cleanPhone,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Search by Plate
     */
    byPlate: publicProcedure
      .input(z.object({ plate: z.string().min(7) }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { plate } = input;

        if (!validatePlate(plate)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Placa inválida",
          });
        }

        const cleanPlate = plate.replace(/\D/g, "").toUpperCase();
        const apis = getApisBySearchType("plate");
        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, cleanPlate);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "plate",
            searchValue: cleanPlate,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Search by CEP
     */
    byCep: publicProcedure
      .input(z.object({ cep: z.string().min(8) }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { cep } = input;

        if (!validateCEP(cep)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CEP inválido",
          });
        }

        const cleanCep = cep.replace(/\D/g, "");
        const apis = getApisBySearchType("cep");
        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, cleanCep);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "cep",
            searchValue: cleanCep,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Search by CNPJ
     */
    byCnpj: publicProcedure
      .input(z.object({ cnpj: z.string().min(14) }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const { cnpj } = input;

        if (!validateCNPJ(cnpj)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CNPJ inválido",
          });
        }

        const cleanCnpj = cnpj.replace(/\D/g, "");
        const apis = getApisBySearchType("cnpj");

        const results: Record<string, unknown> = {};
        const errors: Record<string, string> = {};

        const promises = apis.map(async (api) => {
          try {
            const data = await callExternalAPI(api.endpoint, api.parameterName, cleanCnpj);
            results[api.name] = data;
          } catch (error) {
            errors[api.name] = error instanceof Error ? error.message : "Erro desconhecido";
          }
        });

        await Promise.allSettled(promises);

        const executionTime = Date.now() - startTime;

        if (ctx.user) {
          await saveSearchQuery({
            userId: ctx.user.id,
            searchType: "cnpj",
            searchValue: cleanCnpj,
            results: JSON.stringify(results),
            status: Object.keys(results).length > 0 ? "success" : "error",
            errorMessage: Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
            executionTime,
          });
        }

        return {
          success: Object.keys(results).length > 0,
          results,
          errors,
          executionTime,
          totalApis: apis.length,
          successfulApis: Object.keys(results).length,
        };
      }),

    /**
     * Get search history for authenticated user
     */
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ input, ctx }) => {
        const limit = input?.limit || 50;
        const history = await getUserSearchHistory(ctx.user.id, limit);
        return history;
      }),
  }),

  /**
   * Extended search with API selection
   */
  searchAdvanced: searchAdvancedRouter,
});

export type AppRouter = typeof appRouter;
