import { gmail_v1 } from "googleapis";

export async function getAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<gmail_v1.Schema$MessagePartBody> {
  const messageResponse = await gmail.users.messages.attachments.get({
    userId: "me",
    messageId: messageId,
    id: attachmentId,
  });

  if (!messageResponse.data) {
    throw `Invalid attachment detected`;
  }
  return messageResponse.data;
}
