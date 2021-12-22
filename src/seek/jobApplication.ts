interface JobApplication {
  /**
   * The time email was received in epoch time in ms
   */
  dateReceived: number;
  internalReference: string;
  fullName: string;
  email: string;
  phone: string;
  resume: Attachment;
  coverLetter?: Attachment;
}
