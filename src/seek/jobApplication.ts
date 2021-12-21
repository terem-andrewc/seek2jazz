interface JobApplication {
  internalReference: string;
  fullName: string;
  email: string;
  phone: string;
  resume: Attachment;
  coverLetter?: Attachment;
}
