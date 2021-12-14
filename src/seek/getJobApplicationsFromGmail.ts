import { Credentials, OAuth2ClientOptions } from "google-auth-library";
import { gmail_v1, google } from "googleapis";
import fs from "fs";
import {
  decode,
  findByMimeType,
  getAttachments,
  getSubject,
} from "./messageUtils";
import * as cheerio from "cheerio";

export async function getJobApplicationsFromGmail(
  clientOptions: OAuth2ClientOptions,
  credentials: Credentials
): Promise<JobApplication[]> {
  const oAuth2Client = new google.auth.OAuth2(clientOptions);
  oAuth2Client.setCredentials(credentials);

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const messagesResponse = await gmail.users.messages.list({
    userId: "me",
    q: "noreply@jobapplications.seek.com.au",
  });

  const messageIds: string[] =
    messagesResponse.data.messages?.map((d) => d.id ?? "") ?? [];

  const jobApplications: JobApplication[] = [];

  const results = await Promise.all(
    messageIds.map((messageId) =>
      extractJobApplicationDetails(gmail, messageId)
    )
  );
  // messageIds.forEach(async (messageId) => {
  //   const applicant = await extractJobApplicationDetails(gmail, messageId);
  //   console.log(applicant);
  //   if (applicant) {
  //     jobApplications.push(applicant);
  //   }
  // });
  const filtered: JobApplication[] = [];

  results.forEach((d) => {
    if (d) {
      filtered.push(d);
    }
  });

  return filtered;
}

async function extractJobApplicationDetails(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<JobApplication | null> {
  const messageResponse = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  const message = messageResponse.data;
  if (!message.payload) {
    return null;
  }
  
  // const messagePath = `${messageId}.json`;
  // fs.writeFileSync(messagePath, JSON.stringify(message));

  // const subject = getSubject(message);
  // console.log("subject", subject);

  const htmlPart = findByMimeType(message.payload, "text/html");

  const htmlDecoded = decode(htmlPart?.body?.data);
  const $ = cheerio.load(htmlDecoded);

  const fullName = $("a[title='View candidate']").text();
  const email = $("a[title^='Email']").text();

  //get attachments
  const attachments = getAttachments(message.payload);

  return {
    applicantName: fullName,
    applicantEmail: email,
    attachments: attachments,
  };
}
