import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  categories, InsertCategory,
  transactions, InsertTransaction,
  budgets, InsertBudget,
  goals, InsertGoal,
  chatMessages, InsertChatMessage,
  alerts, InsertAlert,
  documents, InsertDocument,
  investments, InsertInvestment,
  stockCache, InsertStockCache
} from "../drizzle/schema";
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

export async function upsertUser(user: Partial<InsertUser>): Promise<void> {
  // For email/password auth, openId can be generated from email
  if (!user.openId && !user.email) {
    throw new Error("User openId or email is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const openId = user.openId || (user.email ? `email_${user.email}` : undefined);
    if (!openId) {
      throw new Error("Cannot determine openId for user");
    }

    const values: Partial<InsertUser> = {
      openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "passwordHash"] as const;
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
    } else if (openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL
    // Type assertion needed because openId can be nullable in schema but required in InsertUser
    const insertValues: any = {
      ...values,
      openId: openId, // Ensure openId is set
    };
    
    await db.insert(users).values(insertValues).onDuplicateKeyUpdate({
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(user: {
  openId: string;
  email: string;
  passwordHash: string;
  name?: string | null;
  loginMethod?: string;
}) {
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available");
  }

  try {
    // Ensure openId is set (required for insertion even if nullable in schema)
    const insertData: any = {
      openId: user.openId,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name || null,
      loginMethod: user.loginMethod || "email",
      lastSignedIn: new Date(),
    };
    
    await database.insert(users).values(insertData);
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    throw error;
  }
}

// Categories
export async function getUserCategories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name);
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(categories).values(category);
}

// Transactions
export async function getUserTransactions(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db.select().from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }
  
  return db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date))
    .limit(100);
}

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(transaction);
  return result;
}

export async function updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// Budgets
export async function getUserBudgets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(budgets.createdAt);
}

export async function createBudget(budget: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(budgets).values(budget);
}

// Goals
export async function getUserGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(goals.createdAt);
}

export async function createGoal(goal: InsertGoal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(goals).values(goal);
}

// Chat Messages
export async function getUserChatMessages(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(chatMessages).values(message);
}

// Alerts
export async function getUserAlerts(userId: number, onlyUnread: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (onlyUnread) {
    return db.select().from(alerts)
      .where(and(eq(alerts.userId, userId), eq(alerts.isRead, 0)))
      .orderBy(desc(alerts.createdAt));
  }
  
  return db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(50);
}

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(alerts).values(alert);
}

// Documents
export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));
}

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values(document);
  return result;
}

// Analytics
export async function getSpendingByCategory(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    categoryId: transactions.categoryId,
    total: sql<number>`SUM(${transactions.amount})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        gte(transactions.date, startDate),
        lte(transactions.date, endDate)
      )
    )
    .groupBy(transactions.categoryId);
}

// Investments
export async function getUserInvestments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(investments)
    .where(eq(investments.userId, userId))
    .orderBy(desc(investments.updatedAt));
}

export async function createInvestment(investment: InsertInvestment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(investments).values(investment);
}

export async function updateInvestment(id: number, userId: number, updates: Partial<InsertInvestment>) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  
  await database.update(investments)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

export async function deleteInvestment(id: number, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  
  await database.delete(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
}

// Dashboard Stats
export async function getDashboardStats(userId: number) {
  const database = await getDb();
  if (!database) {
    return {
      portfolioTotal: 0,
      monthlyReturn: 0,
      monitoredStocks: 6, // Default
      investmentsCount: 0,
    };
  }
  
  try {
    // Get total portfolio value from investments
    const userInvestments = await getUserInvestments(userId);
    const portfolioTotal = userInvestments.reduce((sum, inv) => sum + (inv.currentValue || inv.totalInvested || 0), 0);
    const investmentsCount = userInvestments.length;
    
    // Calculate monthly return (simplified - would need historical data)
    // For now, calculate based on difference between current value and total invested
    const totalInvested = userInvestments.reduce((sum, inv) => sum + (inv.totalInvested || 0), 0);
    const monthlyReturn = totalInvested > 0 
      ? ((portfolioTotal - totalInvested) / totalInvested) * 100 
      : 0;
    
    // Get unique tickers for monitored stocks count
    const uniqueTickers = new Set(userInvestments.map(inv => inv.ticker));
    const monitoredStocks = Math.max(uniqueTickers.size, 6); // At least 6 (default featured stocks)
    
    return {
      portfolioTotal,
      monthlyReturn: Math.round(monthlyReturn * 100) / 100, // Round to 2 decimal places
      monitoredStocks,
      investmentsCount,
    };
  } catch (error) {
    console.error("[Dashboard] Error getting stats:", error);
    return {
      portfolioTotal: 0,
      monthlyReturn: 0,
      monitoredStocks: 6,
      investmentsCount: 0,
    };
  }
}

// Stock Cache operations
export async function getStockFromCache(ticker: string) {
  const database = await getDb();
  if (!database) return null;
  
  try {
    const result = await database.select().from(stockCache)
      .where(eq(stockCache.ticker, ticker.toUpperCase()))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Error getting stock from cache:", error);
    return null;
  }
}

export async function upsertStockCache(data: {
  ticker: string;
  normalizedTicker?: string;
  name?: string;
  currentPrice?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  currency?: string;
  market?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  historyData?: string;
}) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  
  try {
    const ticker = data.ticker.toUpperCase();
    const existing = await getStockFromCache(ticker);
    
    const cacheData: any = {
      ticker,
      normalizedTicker: data.normalizedTicker || null,
      name: data.name || null,
      currentPrice: data.currentPrice ? Math.round(data.currentPrice * 100) : null, // Convert to cents
      previousClose: data.previousClose ? Math.round(data.previousClose * 100) : null,
      change: data.change ? Math.round(data.change * 100) : null,
      changePercent: data.changePercent ? Math.round(data.changePercent * 100) : null, // Store as integer (250 = 2.50%)
      dayHigh: data.dayHigh ? Math.round(data.dayHigh * 100) : null,
      dayLow: data.dayLow ? Math.round(data.dayLow * 100) : null,
      volume: data.volume || null,
      currency: data.currency || "BRL",
      market: data.market || null,
      sector: data.sector || null,
      industry: data.industry || null,
      marketCap: data.marketCap ? String(data.marketCap) : null, // Converte para string
      historyData: data.historyData || null,
      lastUpdated: new Date(),
    };

    if (existing) {
      await database.update(stockCache)
        .set(cacheData)
        .where(eq(stockCache.ticker, ticker));
    } else {
      await database.insert(stockCache).values({
        ...cacheData,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[Database] Error upserting stock cache:", error);
    throw error;
  }
}

export async function getAllCachedStocks() {
  const database = await getDb();
  if (!database) return [];
  
  try {
    return await database.select().from(stockCache)
      .orderBy(stockCache.ticker);
  } catch (error) {
    console.error("[Database] Error getting all cached stocks:", error);
    return [];
  }
}

export async function isStockCacheStale(ticker: string, maxAgeMinutes: number = 15) {
  const cached = await getStockFromCache(ticker);
  if (!cached || !cached.lastUpdated) return true;
  
  const ageMs = Date.now() - cached.lastUpdated.getTime();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  return ageMs > maxAgeMs;
}
