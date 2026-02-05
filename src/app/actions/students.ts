"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { inArray, asc } from "drizzle-orm";
import { unstable_cache } from "next/cache";

const STUDENTS_CACHE_TAG = 'students-list';

export const getCachedStudents = unstable_cache(
  async () => {
    const result = await db
      .select({
        id: users.id,
        full_name: users.full_name,
        email_address: users.email_address,
      })
      .from(users)
      .where(inArray(users.role, ["STUDENT", "ADMIN"]))
      .orderBy(asc(users.full_name));

    return result.map((u) => ({
      id: u.id,
      full_name: u.full_name || "Unknown Name",
      email_address: u.email_address,
    }));
  },
  ['students-for-selection'],
  {
    tags: [STUDENTS_CACHE_TAG],
    revalidate: 300 // 5 minutes - student list changes rarely
  }
);