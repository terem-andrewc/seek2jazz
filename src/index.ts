import fs from "fs";
import dotenv from "dotenv";
import { requestGmailAuthorization } from "./gmail/requestGmailAuthorization";
import { OAuth2ClientOptions } from "google-auth-library";
import { getJobApplicationsFromGmail } from "./seek/getJobApplicationsFromGmail";
import { getApplicantIdByNameAndEmail } from "./jazz-hr/extensions";
import _ from "lodash";
import { postApplicant, postFile } from "./jazz-hr/api";
import HttpStatusCode from "./jazz-hr/httpStatusCode";

dotenv.config();

async function main() {
  if (!isValidEnvFile()) {
    throw `Invalid or missing .env file`;
  }

  const clientOptions = getOAuth2ClientOptions();

  const credentialsPath = "./credentials.json";
  if (!fs.existsSync(credentialsPath)) {
    console.log("Generating credentials via OAuth flow...");
    const credentials = requestGmailAuthorization(clientOptions);
    fs.writeFileSync(credentialsPath, JSON.stringify(credentials));
  }

  console.log("Loading credentials...");
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  const jobApplications = await getJobApplicationsFromGmail(
    clientOptions,
    credentials
  );
  console.log("jobApplications", jobApplications);

  //process each job application
  for (let i = 0; i < jobApplications.length; i++) {
    const application = jobApplications[i];
    const applicantLastname = getLastname(application.applicantName);
    const applicantFirstname = getFirstname(application.applicantName);
    console.log("Applicant name:", applicantFirstname, applicantLastname);
    const applicantId = await getApplicantIdByNameAndEmail(
      applicantLastname,
      application.applicantEmail
    );
    if (applicantId) {
      console.log("Applicant found:", application.applicantEmail, applicantId);
    } else {
      console.log("Applicant missing:", application.applicantName);
      console.log("Creating applicant:", application.applicantName);
      const response = await postApplicant({
        first_name: applicantFirstname,
        last_name: applicantLastname,
        email: application.applicantEmail,
        apikey: process.env.JAZZHR_API_KEY ?? "",
      });

      if (response.status !== HttpStatusCode.OK) {
        console.log("Applicant creation failed", response);
        return;
      }
      console.log("Applicant created:", response.data);
      const prospectId = response.data.prospect_id;

      if (!application.resume.data) {
        console.log("Invalid resume");
      }
      const postResumeResult = await postFile({
        applicant_id: prospectId,
        filename: application.resume.filename,
        file_data: application.resume.data ?? "",
      });

      console.log("Resume uploaded:", postResumeResult.data);
    }
  }
}

main();

function isValidEnvFile(): boolean {
  const isMissingVariable =
    !process.env.CLIENT_ID ||
    !process.env.CLIENT_SECRET ||
    !process.env.REDIRECT_URI ||
    !process.env.JAZZHR_BASE_URL ||
    !process.env.JAZZHR_API_KEY;

  return !isMissingVariable;
}

function getOAuth2ClientOptions(): OAuth2ClientOptions {
  return {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI,
  };
}

function getLastname(fullname: string): string {
  const parts = fullname.split(" ");
  return parts[parts.length - 1];
}

function getFirstname(fullname: string): string {
  const parts = fullname.split(" ");
  const firstNameParts = _.dropRight(parts, 1);
  return firstNameParts.join(" ");
}
