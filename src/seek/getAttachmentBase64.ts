import { gmail_v1 } from "googleapis";
import { getAttachment } from "../gmail/api";
import { base64urlToBase64 } from "./messageUtils";

export async function getAttachmentBase64(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const gmailAttachment = await getAttachment(gmail, messageId, attachmentId);

  if (!gmailAttachment.data) {
    throw `Invalid gmail attachment`;
  }
  const data = base64urlToBase64(gmailAttachment.data);

  return data;
}
