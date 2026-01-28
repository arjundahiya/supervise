import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  index,
  unique,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const roleEnum = pgEnum("role", ["STUDENT", "ADMIN"]);
export const availabilityTypeEnum = pgEnum("availability_type", ["PERSONAL", "GLOBAL"]);
export const swapStatusEnum = pgEnum("swap_status", ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]);

// --- TABLES ---

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  full_name: text("full_name").notNull(),
  email_address: text("email_address").notNull().unique(),
  role: roleEnum("role").default("STUDENT").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => ({
  userIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("account_user_id_idx").on(table.userId),
}));

export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  identifierIdx: index("verification_identifier_idx").on(table.identifier),
}));

export const availabilities = pgTable("availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: availabilityTypeEnum("type").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("availability_user_id_idx").on(table.userId),
  timeRangeIdx: index("availability_time_range_idx").on(table.startsAt, table.endsAt),
}));

export const supervisions = pgTable("supervision", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  timeRangeIdx: index("supervision_time_range_idx").on(table.startsAt, table.endsAt),
}));

// --- JUNCTION TABLE (Many-to-Many) ---
export const usersToSupervisions = pgTable("users_to_supervisions", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  supervisionId: uuid("supervision_id").notNull().references(() => supervisions.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.supervisionId] }),
}));

export const swapRequests = pgTable("swap_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  supervisionId: uuid("supervision_id").notNull().references(() => supervisions.id, { onDelete: "cascade" }),
  requesterId: text("requester_id").notNull().references(() => users.id),
  targetId: text("target_id").notNull().references(() => users.id),
  status: swapStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  supervisionIdIdx: index("swap_supervision_idx").on(table.supervisionId),
  requesterIdIdx: index("swap_requester_idx").on(table.requesterId),
  targetIdIdx: index("swap_target_idx").on(table.targetId),
  statusIdx: index("swap_status_idx").on(table.status),
}));

// --- RELATIONS (Drizzle Queries API) ---

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  availabilities: many(availabilities),
  supervisions: many(usersToSupervisions),
  swapRequestsMade: many(swapRequests, { relationName: "SwapRequester" }),
  swapRequestsReceived: many(swapRequests, { relationName: "SwapTarget" }),
}));

export const supervisionsRelations = relations(supervisions, ({ many }) => ({
  students: many(usersToSupervisions),
  swapRequests: many(swapRequests),
}));

export const usersToSupervisionsRelations = relations(usersToSupervisions, ({ one }) => ({
  user: one(users, { fields: [usersToSupervisions.userId], references: [users.id] }),
  supervision: one(supervisions, { fields: [usersToSupervisions.supervisionId], references: [supervisions.id] }),
}));

export const swapRequestsRelations = relations(swapRequests, ({ one }) => ({
  supervision: one(supervisions, { fields: [swapRequests.supervisionId], references: [supervisions.id] }),
  requester: one(users, { fields: [swapRequests.requesterId], references: [users.id], relationName: "SwapRequester" }),
  target: one(users, { fields: [swapRequests.targetId], references: [users.id], relationName: "SwapTarget" }),
}));