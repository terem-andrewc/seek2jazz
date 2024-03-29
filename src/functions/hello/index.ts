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
    CLIENT_ID: "${env:CLIENT_ID}",
    CLIENT_SECRET: "${env:CLIENT_SECRET}",
    REDIRECT_URI: "${env:REDIRECT_URI}",
    JAZZHR_BASE_URL: "${env:JAZZHR_BASE_URL}",
    JAZZHR_API_KEY: "${env:JAZZHR_API_KEY}",
    GOOGLE_CREDENTIALS: "{{resolve:ssm:seek2jazzGoogleCredentials:1}}",
  },
};
