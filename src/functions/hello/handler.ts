import * as _ from "lodash";
import schema from "./schema";
import { OAuth2ClientOptions } from "google-auth-library";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "../../libs/apiGateway";
import { getApplicantIdByNameAndEmail } from "../../jazz-hr/extensions";
import {
  getJobsByBoardCode,
  postApplicant,
  postApplicants2Jobs,
  postFile,
} from "../../jazz-hr/api";
import HttpStatusCode from "../../jazz-hr/httpStatusCode";
import { middyfy } from "../../libs/lambda";
import { getJobApplicationsFromGmail } from "../../seek/getJobApplicationsFromGmail";
import S3 from "aws-sdk/clients/s3";

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  await execute();
  return formatJSONResponse({
    message: `Hello , welcome to the exciting Serverless world!`,
    event,
  });
};

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

async function execute() {
  if (!isValidEnvFile()) {
    throw "Invalid or missing ENV variables";
  }

  const clientOptions = getOAuth2ClientOptions();

  console.log("Loading credentials...");
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS ?? "");

  console.log("Loading app state...");

  const s3 = new S3();
  const appData: S3.GetObjectOutput = await new Promise((resolve, reject) => {
    s3.getObject(
      {
        Bucket: "seek2jazz-bucket",
        Key: "appState.json",
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
  const appState: AppState = JSON.parse(appData.Body.toString("utf-8"));
  console.log("AppState", appState);

  const afterTimestamp = Math.floor(appState.lastSynchronized / 1000);
  const jobApplications = await getJobApplicationsFromGmail(
    afterTimestamp,
    clientOptions,
    credentials
  );

  //remove last processed
  _.remove(jobApplications, (item) => item.messageId == appState.lastMessageId);

  //items are in random order
  jobApplications.sort((a, b) => a.dateReceived - b.dateReceived);

  if (jobApplications.length === 0) {
    console.log("No job applications to process...");
    return;
  }

  try {
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

        applicantId = response.data.prospect_id;

        if (application.coverLetter) {
          const postFileResponse = await postFile({
            applicant_id: applicantId,
            filename: application.coverLetter.filename,
            file_data: application.coverLetter.data,
          });
          if (postFileResponse.status !== HttpStatusCode.OK) {
            throw `Cover letter upload failed: ${response.statusText}`;
          }
        }
        console.log("Applicant created.", response.data.prospect_id);
      }

      //look for job
      const matchingJobs = await getJobsByBoardCode(
        application.internalReference
      );
      if (matchingJobs.length !== 1 || !matchingJobs[0].id) {
        console.log(
          `Internal reference not found: ${application.internalReference}`
        );
        continue;
      }

      const jobId = matchingJobs[0].id;
      console.log("Linking to job:", jobId);
      // server does check existance check
      const applicant2JobPostResponse = await postApplicants2Jobs({
        applicant_id: applicantId,
        job_id: jobId,
        apikey: process.env.JAZZHR_API_KEY ?? "",
      });

      if (applicant2JobPostResponse.status !== HttpStatusCode.OK) {
        throw `Error while creating applicant2job ${applicant2JobPostResponse}`;
      }
    }
    // update timestamp if items were processed with no errors
    if (jobApplications.length > 0) {
      const lastMessage = jobApplications.reduce((a, b) => {
        return a.dateReceived > b.dateReceived ? a : b;
      });

      appState.lastSynchronized = lastMessage.dateReceived;
      appState.lastMessageId = lastMessage.messageId;

      const putObjectOutput: S3.PutObjectOutput = await new Promise(
        (resolve, reject) => {
          s3.putObject(
            {
              Bucket: "seek2jazz-bucket",
              Key: "appState.json",
              Body: JSON.stringify(appState),
              ContentType: "application/json",
            },
            (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            }
          );
        }
      );

      console.log("AppState updated", putObjectOutput);
    }
  } catch (reason) {
    console.log(reason);
  }
}

export const main = middyfy(hello);
