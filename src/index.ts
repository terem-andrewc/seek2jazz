import { gmail_v1, google } from "googleapis";
import fs from "fs";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  const tokenPath = "./token.json";
  if (!fs.existsSync(tokenPath)) {
    console.log("token.json not found...");
    console.log("Generating token via OAuth flow...");

    const scope = "https://www.googleapis.com/auth/gmail.readonly";
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scope,
    });

    console.log("Authorize this app by visiting this url:", authUrl);
    const code = await requestAuthorizationCode();

    console.log("Authorization Code: ", code);

    const tokenResponse = await oAuth2Client.getToken(code);
    console.log("tokenResponse", tokenResponse);

    fs.writeFileSync(tokenPath, JSON.stringify(tokenResponse.tokens));
  }

  console.log("Loading credentials...");
  const credentials = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  console.log("Expiry date: ", new Date(credentials.expiry_date));
  oAuth2Client.setCredentials(credentials);

  console.log("Loading SEEK job applications...");
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const messagesResponse = await gmail.users.messages.list({
    userId: "me",
    q: "noreply@jobapplications.seek.com.au",
  });

  const messageIds: string[] =
    messagesResponse.data.messages?.map((d) => d.id ?? "") ?? [];

  console.log("messageIds", messageIds);

  messageIds.forEach((messageId) => {
    extractJobApplicationDetails(gmail, messageId);
  });
}

main();

async function extractJobApplicationDetails(
  gmail: gmail_v1.Gmail,
  messageId: string
) {
  const messageInfo = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  console.log("messageInfo", messageInfo.data);
  const messagePath = `${messageId}.json`;
  fs.writeFileSync(messagePath, JSON.stringify(messageInfo.data));
}

function requestAuthorizationCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const readLineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readLineInterface.question("Enter authorization code: ", (code: string) => {
      resolve(code);
      readLineInterface.close();
    });
  });
}
