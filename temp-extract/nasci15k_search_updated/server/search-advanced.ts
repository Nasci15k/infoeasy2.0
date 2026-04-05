import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getApisByCategory, validateIP, validateMAC, validatePlate, getApiById } from "./apis-extended";
import { formatResponse } from "./formatters";

/**
 * Helper function to call external APIs with formatting
 */
async function callExternalAPI(
  endpoint: string,
  paramName: string,
  paramValue: string,
  apiId?: string
): Promise<unknown> {
  try {
    let url = endpoint;

    // Handle URL parameter replacement
    if (endpoint.includes("{")) {
      url = endpoint.replace(/{(\w+)}/g, paramValue);
    } else {
      const urlObj = new URL(endpoint);
      urlObj.searchParams.set(paramName, paramValue);
      url = urlObj.toString();
    }

    // Add token if needed (for Serpro API)
    if (apiId === "placa-serpro") {
      url += `&token=KeyBesh`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Nasci15k-Search/2.0",
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

export const searchAdvancedRouter = router({
  /**
   * Get available APIs by category
   */
  getApisByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      const apis = getApisByCategory(input.category);
      return apis.map((api) => ({
        id: api.id,
        name: api.name,
        description: api.description,
      }));
    }),

  /**
   * Search by IP with selected API
   */
  byIp: publicProcedure
    .input(
      z.object({
        ip: z.string().min(7),
        apiId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const { ip } = input;

      if (!validateIP(ip)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IP inválido",
        });
      }

      const apis = getApisByCategory("ip");
      const selectedApi = input.apiId ? apis.find((a) => a.id === input.apiId) : apis[0];

      if (!selectedApi) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API não encontrada",
        });
      }

      try {
        const data = await callExternalAPI(selectedApi.endpoint, selectedApi.parameterName, ip, selectedApi.id);
        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data,
          formatted: formatResponse(data, "ip"),
          apiUsed: selectedApi.name,
          executionTime,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar IP",
        });
      }
    }),

  /**
   * Search by MAC Address with selected API
   */
  byMac: publicProcedure
    .input(
      z.object({
        mac: z.string().min(17),
        apiId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const { mac } = input;

      if (!validateMAC(mac)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "MAC Address inválido (formato: XX:XX:XX:XX:XX:XX ou XX-XX-XX-XX-XX-XX)",
        });
      }

      const apis = getApisByCategory("mac");
      const selectedApi = input.apiId ? apis.find((a) => a.id === input.apiId) : apis[0];

      if (!selectedApi) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API não encontrada",
        });
      }

      try {
        const data = await callExternalAPI(selectedApi.endpoint, selectedApi.parameterName, mac, selectedApi.id);
        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data,
          formatted: formatResponse(data, "mac"),
          apiUsed: selectedApi.name,
          executionTime,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar MAC",
        });
      }
    }),

  /**
   * Search by Plate with selected API
   */
  byPlate: publicProcedure
    .input(
      z.object({
        plate: z.string().min(7),
        apiId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();
      const { plate } = input;

      if (!validatePlate(plate)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Placa inválida",
        });
      }

      const cleanPlate = plate.replace(/\D/g, "").toUpperCase();
      const apis = getApisByCategory("placa");
      const selectedApi = input.apiId ? apis.find((a) => a.id === input.apiId) : apis[0];

      if (!selectedApi) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "API não encontrada",
        });
      }

      try {
        const data = await callExternalAPI(selectedApi.endpoint, selectedApi.parameterName, cleanPlate, selectedApi.id);
        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data,
          formatted: formatResponse(data, "placa"),
          apiUsed: selectedApi.name,
          executionTime,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar placa",
        });
      }
    }),
});
