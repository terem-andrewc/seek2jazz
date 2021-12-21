import { gmail_v1 } from "googleapis";
import * as cheerio from "cheerio";

export function getPhone(messageHtml: string): string {
  const $ = cheerio.load(messageHtml);
  const phone = $("p:contains('Phone')")?.next()?.text().trim();
  return phone;
}

export function getInternalReference(
  messagePart: gmail_v1.Schema$MessagePart
): string {
  const subject = getSubject(messagePart);
  return subject.replace(/^.*?ref:\s(.*?)$/g, "$1");
}

function getSubject(messagePart: gmail_v1.Schema$MessagePart): string {
  if (!messagePart.headers) {
    return "";
  }

  const subject = messagePart.headers.find((headerPart) => {
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

export function getAttachmentInfo(
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
      const childAttachments = getAttachmentInfo(part);
      attachments.push(...childAttachments);
    });
  }

  return attachments;
}

export function base64urlToBase64(base64url: string): string {
  var base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  if (base64.length % 4 != 0) {
    var padCharacters = 4 - (base64.length % 4);
    base64 = base64 + "=".repeat(padCharacters);
  }
  return base64;
}

export function decode(input: string | null | undefined): string {
  if (!input) {
    return "";
  }

  const text = Buffer.from(input, "base64").toString("ascii");
  return decodeURIComponent(escape(text));
}
