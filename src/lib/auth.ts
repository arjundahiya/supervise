import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins"

export const auth = betterAuth({
    plugins: [
        genericOAuth({ 
            config: [ 
                { 
                    providerId: "raven", 
                    clientId: process.env.RAVEN_ID?? "", 
                    clientSecret: process.env.RAVEN_SECRET, 
                    discoveryUrl: process.env.RAVEN_OAUTH2_URL, 
                }, 
            ] 
        }) 
    ]
});
