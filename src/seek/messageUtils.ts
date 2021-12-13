import { gmail_v1 } from "googleapis";

export function getSubject(message: gmail_v1.Schema$Message): string {
  if (!message.payload) {
    return "";
  }

  if (!message.payload.headers) {
    return "";
  }

  const subject = message.payload.headers.find((headerPart) => {
    return headerPart.name === "Subject";
  });

  return subject?.value ?? "";
}

export function findByMimeType(
  part: gmail_v1.Schema$MessagePart,
  mimeType: string | null | undefined
): gmail_v1.Schema$MessagePart | null {
  if (part.mimeType === mimeType) {
    return part;
  }

  if (part.parts) {
    for (let index = 0; index < part.parts.length; index++) {
      const element = part.parts[index];
      const match = findByMimeType(element, mimeType);
      if (match) {
        return match;
      }
    }
  }
  return null;
}

export function getAttachments(
  part: gmail_v1.Schema$MessagePart
): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];

  if (part.filename && part.body?.attachmentId) {
    const attachmentId = part.body?.attachmentId;
    attachments.push({
      filename: part.filename,
      attachmentId: attachmentId,
    });
  }

  if (part.parts) {
    part.parts.forEach((part) => {
      const childAttachments = getAttachments(part);
      attachments.push(...childAttachments);
    });
  }

  return attachments;
}

export function decode(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  const text = Buffer.from(input, "base64").toString("ascii");
  return decodeURIComponent(escape(text));
}
