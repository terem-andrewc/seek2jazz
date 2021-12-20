import { gmail_v1 } from "googleapis";
import { base64urlToBase64 } from "./messageUtils";

export async function getAttachmentBase64(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<string> {
  const messageResponse = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId: messageId,
    id: attachmentId,
  });

  if (!messageResponse.data) {
    throw `Invalid attachment detected`;
  }

  const gmailAttachment = messageResponse.data;

  if (!gmailAttachment.data) {
    throw `Invalid gmail attachment`;
  }
  const data = base64urlToBase64(gmailAttachment.data);

  return data;
}
