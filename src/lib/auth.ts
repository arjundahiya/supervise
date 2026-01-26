import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins"
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
    user: {
        modelName: "users",
        fields: {
            name: "full_name",
            email: "email_address",
        },
        additionalFields: {
            role: {
                type: ["STUDENT", "ADMIN"],
                required: true,
                defaultValue: "STUDENT",
                input: false, // don't allow user to set role
            },
        },
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "raven",
                    clientId: process.env.RAVEN_ID ?? "",
                    clientSecret: process.env.RAVEN_SECRET,
                    discoveryUrl: process.env.RAVEN_OAUTH2_URL,
                },
            ]
        })
    ],
});
