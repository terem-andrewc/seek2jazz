import fs from "fs";
import dotenv from "dotenv";
import { requestGmailAuthorization } from "./gmail/requestGmailAuthorization";
import { OAuth2ClientOptions } from "google-auth-library";
import { getJobApplicationsFromGmail } from "./seek/getJobApplicationsFromGmail";
import { getApplicantIdByNameAndEmail } from "./jazz-hr/extensions";
import _ from "lodash";
import {
  getJobsByBoardCode,
  postApplicant,
  postApplicants2Jobs,
  postFile,
} from "./jazz-hr/api";
import HttpStatusCode from "./jazz-hr/httpStatusCode";

dotenv.config();

async function main() {
  if (!isValidEnvFile()) {
    throw "Invalid or missing .env file";
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

  //process each job application
  for (let i = 0; i < jobApplications.length; i++) {
    const application = jobApplications[i];
    console.log(
      "Processing job application:",
      application.fullName,
      application.internalReference
    );
    const firstname = getFirstname(application.fullName);
    const lastname = getLastname(application.fullName);
    let applicantId: string | undefined = await getApplicantIdByNameAndEmail(
      lastname,
      application.email
    );
    if (!applicantId) {
      console.log("Creating applicant:", application.fullName);
      const response = await postApplicant({
        first_name: firstname,
        last_name: lastname,
        email: application.email,
        apikey: process.env.JAZZHR_API_KEY ?? "",
        phone: application.phone,
        "base64-resume": application.resume.data,
      });

      if (response.status !== HttpStatusCode.OK) {
        throw `Applicant creation failed: ${response.statusText}`;
      }

      console.log("Applicant created.", response.data.prospect_id);
      applicantId = response.data.prospect_id;

      if (application.coverLetter) {
        const postFileResponse = await postFile({
          applicant_id: applicantId,
          filename: application.coverLetter.filename,
          file_data: application.coverLetter.data,
        });
        console.log("Cover letter uploaded:", postFileResponse.data);
      }
    }

    //look for job
    const matchingJobs = await getJobsByBoardCode(
      application.internalReference
    );
    if (matchingJobs.length !== 1 || !matchingJobs[0].id) {
      throw `Internal reference not found: ${application.internalReference}`;
    }
    const jobId = matchingJobs[0].id;
    console.log("Creating job to applicant link:", jobId, applicantId);

    // server does check existance check
    const applicant2JobPostResponse = await postApplicants2Jobs({
      applicant_id: applicantId,
      job_id: jobId,
      apikey: process.env.JAZZHR_API_KEY ?? "",
    });

    if (applicant2JobPostResponse.status !== HttpStatusCode.OK) {
      throw `Error while creating applicant2job ${applicant2JobPostResponse}`;
    }
    console.log("Linkage created", applicant2JobPostResponse.data);
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
