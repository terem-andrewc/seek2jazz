import { google } from "googleapis";
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

  //now try gmail
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const messagesResponse = await gmail.users.messages.list({ userId: "me" });
  console.log("messages", messagesResponse.data.messages);

}

main();

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
