import { Credentials, OAuth2ClientOptions } from "google-auth-library";
import { gmail_v1, google } from "googleapis";
import {
  decode,
  findByMimeType,
  getAttachmentInfo,
  getInternalReference,
  getPhone,
} from "./messageUtils";
import * as cheerio from "cheerio";
import { getAttachmentBase64 } from "./getAttachmentBase64";

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

  const results = await Promise.all(
    messageIds.map((messageId) =>
      extractJobApplicationDetails(gmail, messageId)
    )
  );
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

  const htmlPart = findByMimeType(message.payload, "text/html");
  const htmlDecoded = decode(htmlPart?.body?.data);

  // // save to file
  // const htmlFilePath = `${messageId}.html`;
  // fs.writeFileSync(htmlFilePath, htmlDecoded);

  const $ = cheerio.load(htmlDecoded);
  const fullName = $("a[title='View candidate']").text();
  const email = $("a[title^='Email']").text();
  const internalReference = getInternalReference(message.payload);
  console.log("internalReference", internalReference);

  //get attachments
  const attachmentInfo = getAttachmentInfo(message.payload);

  const resumeInfo = attachmentInfo.find((item) =>
    isResumeFilename(item.filename)
  );
  if (!resumeInfo) {
    throw `Invalid application`;
  }
  const resumeData = await getAttachmentBase64(
    gmail,
    messageId,
    resumeInfo.attachmentId
  );

  const coverLetter = attachmentInfo.find((item) =>
    isCoverLetterFilename(item.filename)
  );

  const phone = getPhone(htmlDecoded);
  const result: JobApplication = {
    internalReference,
    fullName,
    email,
    phone,
    resume: {
      filename: resumeInfo.filename,
      data: resumeData,
    },
  };

  if (coverLetter) {
    const coverLetterData = await getAttachmentBase64(
      gmail,
      messageId,
      coverLetter.attachmentId
    );
    result.coverLetter = {
      filename: coverLetter.filename,
      data: coverLetterData,
    };
  }

  return result;
}

function isResumeFilename(filename: string): boolean {
  return filename.toLowerCase().indexOf("resume") >= 0;
}
function isCoverLetterFilename(filename: string): boolean {
  return filename.toLowerCase().indexOf("cover letter") >= 0;
}
