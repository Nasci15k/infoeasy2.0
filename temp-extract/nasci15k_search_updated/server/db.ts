import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, InsertSearchQuery, InsertApiEndpoint, users, searchQueries, apiEndpoints } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save search query to history
 */
export async function saveSearchQuery(query: InsertSearchQuery) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save search query: database not available");
    return;
  }

  try {
    const result = await db.insert(searchQueries).values(query);
    return result;
  } catch (error) {
    console.error("[Database] Failed to save search query:", error);
    throw error;
  }
}

/**
 * Get search history for a user
 */
export async function getUserSearchHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get search history: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(searchQueries)
      .where(eq(searchQueries.userId, userId))
      .orderBy(desc(searchQueries.createdAt))
      .limit(limit);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get search history:", error);
    return [];
  }
}

/**
 * Get all active API endpoints
 */
export async function getActiveApiEndpoints() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get API endpoints: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(apiEndpoints)
      .where(eq(apiEndpoints.isActive, 1));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get API endpoints:", error);
    return [];
  }
}

/**
 * Get API endpoints by category
 */
export async function getApiEndpointsByCategory(category: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get API endpoints: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(apiEndpoints)
      .where(eq(apiEndpoints.category, category));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get API endpoints by category:", error);
    return [];
  }
}
