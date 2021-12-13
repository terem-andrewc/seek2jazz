import { Credentials, OAuth2ClientOptions } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

export async function requestGmailAuthorization(
  options: OAuth2ClientOptions
): Promise<Credentials> {
  const oAuth2Client = new google.auth.OAuth2(options);

  const scope = "https://www.googleapis.com/auth/gmail.readonly";
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scope,
  });

  console.log("Authorize this app by visiting this url:", authUrl);
  const code = await requestAuthorizationCode();

  console.log("Authorization Code:", code);

  const tokenResponse = await oAuth2Client.getToken(code);
  return tokenResponse.tokens;
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
