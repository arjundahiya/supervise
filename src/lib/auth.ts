import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
        users: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
    },
    }),
    user: {
        // modelName must match the table key in your schema object
        modelName: "users", 
        fields: {
            name: "full_name",
            email: "email_address",
        },
        additionalFields: {
            role: {
                type: "string", // Use "string" here; the DB enum handles the validation
                required: true,
                defaultValue: "STUDENT",
                input: false,
            },
        },
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "raven",
                    clientId: process.env.RAVEN_ID ?? "",
                    clientSecret: process.env.RAVEN_SECRET as string,
                    discoveryUrl: process.env.RAVEN_OAUTH2_URL,
                    // Raven (Cambridge) usually returns 'name' or 'display_name'
                    // Better Auth will map it to 'full_name' based on your user.fields config
                },
            ],
        }),
    ],
});