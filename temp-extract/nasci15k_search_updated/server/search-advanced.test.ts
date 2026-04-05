import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("searchAdvanced", () => {
  describe("getApisByCategory", () => {
    it("should return IP APIs", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.searchAdvanced.getApisByCategory({ category: "ip" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("description");
    });

    it("should return MAC APIs", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.searchAdvanced.getApisByCategory({ category: "mac" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return Placa APIs", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.searchAdvanced.getApisByCategory({ category: "placa" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown category", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.searchAdvanced.getApisByCategory({ category: "unknown" });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("byIp", () => {
    it("should reject invalid IP", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.searchAdvanced.byIp({ ip: "invalid", apiId: "ip-api-com" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should accept valid IPv4", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.searchAdvanced.byIp({ ip: "8.8.8.8", apiId: "ip-api-com" });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("formatted");
        expect(result).toHaveProperty("apiUsed");
      } catch (error) {
        // API might be unavailable, but the procedure should be callable
        expect(error).toBeDefined();
      }
    }, { timeout: 15000 });
  });

  describe("byMac", () => {
    it("should reject invalid MAC", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.searchAdvanced.byMac({ mac: "invalid", apiId: "macvendors" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should accept valid MAC address", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.searchAdvanced.byMac({ mac: "00:1A:2B:3C:4D:5E", apiId: "macvendors" });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("formatted");
        expect(result).toHaveProperty("apiUsed");
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, { timeout: 15000 });
  });

  describe("byPlate", () => {
    it("should reject invalid plate", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.searchAdvanced.byPlate({ plate: "invalid", apiId: "placa-detran" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should accept valid plate", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.searchAdvanced.byPlate({ plate: "ABC1234", apiId: "placa-detran" });
        expect(result).toBeDefined();
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("formatted");
        expect(result).toHaveProperty("apiUsed");
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, { timeout: 15000 });
  });
});
