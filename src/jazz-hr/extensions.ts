// additional methods that wrap API functionality

import { getApplicantDetailsById, getApplicantsByName } from ".";
import HttpStatusCode from "./httpStatusCode";

// JazzHR doesn't have a simple API to check for existing user via email. Need to use this roundabout method for now
export async function getApplicantIdByNameAndEmail(
  name: string,
  email: string
): Promise<string | undefined> {
  const matchingApplicantsByName = await getApplicantsByName(name);

  const matchingApplicantDetailsResponse = await Promise.all(
    matchingApplicantsByName.map((applicant) =>
      getApplicantDetailsById(applicant.id)
    )
  );

  if (
    !matchingApplicantDetailsResponse.every(
      (r) => r.status === HttpStatusCode.OK
    )
  ) {
    throw `Error in getApplicantIdByNameAndEmail`;
  }

  const match = matchingApplicantDetailsResponse.find(
    (r) => r.data.email === email
  );

  return match?.data.id ?? undefined;
}
