import fs from "fs";
import dotenv from "dotenv";
import { requestGmailAuthorization } from "./gmail/requestGmailAuthorization";
import { OAuth2ClientOptions } from "google-auth-library";
import { getJobApplicationsFromGmail } from "./seek/getJobApplicationsFromGmail";

dotenv.config();

async function main() {
  if (!isValidEnvFile()) {
    throw `Invalid or missing .env file`;
  }

  const clientOptions = getOAuth2ClientOptions();

  const credentialsPath = "./credentials.json";
  if (!fs.existsSync(credentialsPath)) {
    console.log("Generating credentials via OAuth flow...");
    const credentials = requestGmailAuthorization(clientOptions);
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
  }

  console.log("Loading credentials...");
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  getJobApplicationsFromGmail(clientOptions, credentials);
}

main();

function isValidEnvFile(): boolean {
  const isMissingVariable =
    !process.env.CLIENT_ID ||
    !process.env.CLIENT_SECRET ||
    !process.env.REDIRECT_URI;

  return !isMissingVariable;
}

function getOAuth2ClientOptions(): OAuth2ClientOptions {
  return {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  };
}
