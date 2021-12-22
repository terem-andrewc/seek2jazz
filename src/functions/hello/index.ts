// @ts-ignore
import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      schedule: "rate(5 minutes)",
    },
  ],
  environment: {
    CLIENT_ID: "<CLIENT_ID>",
    CLIENT_SECRET: "<CLIENT_SECRET>",
    REDIRECT_URI: "<REDIRECT_URI>",
    JAZZHR_BASE_URL: "https://api.resumatorapi.com/v1",
    JAZZHR_API_KEY: "<JAZZHR_API_KEY>",
    GOOGLE_CREDENTIALS: "{{resolve:ssm:GOOGLE_CREDENTIALS:1}}",
  },
};
