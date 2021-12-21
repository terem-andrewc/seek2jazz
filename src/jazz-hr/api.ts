import axios, { AxiosInstance, AxiosResponse } from "axios";

function getAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: process.env.JAZZHR_BASE_URL,
    params: {
      apikey: process.env.JAZZHR_API_KEY,
    },
  });
}

export async function getApplicants(): Promise<Applicant[]> {
  const response = await getAxiosInstance().get<Applicant[]>("/applicants");
  return response.data;
}

export async function getJobs(): Promise<any> {
  const response = await getAxiosInstance().get("/jobs");
  return response.data;
}

export async function getJobsByBoardCode(boardCode: string): Promise<Job[]> {
  const response = await getAxiosInstance().get(
    `/jobs/board_code/${boardCode}`
  );
  if (response.data === null) {
    return [];
  } else if (typeof response.data === "object") {
    return [response.data];
  } else if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

export async function getApplicantsByName(
  name: string
): Promise<Applicant[] | Applicant> {
  const response = await getAxiosInstance().get<Applicant[]>(
    `/applicants/name/${encodeURIComponent(name)}`
  );
  return response.data;
}

export async function postFile(
  request: FilePostRequest
): Promise<AxiosResponse<any, any>> {
  return getAxiosInstance().post(`/files`, request);
}

export async function getApplicantDetailsById(
  id: string
): Promise<AxiosResponse<ApplicantDetails>> {
  return getAxiosInstance().get<ApplicantDetails>(`/applicants/${id}`);
}

export async function postApplicant(
  request: ApplicantPostRequest
): Promise<AxiosResponse<ApplicantPostResponse>> {
  return getAxiosInstance().post<ApplicantPostResponse, any>(
    `/applicants`,
    request
  );
}

export async function postApplicants2Jobs(
  request: Applicants2JobsPostRequest
): Promise<AxiosResponse<any>> {
  return getAxiosInstance().post(`/applicants2jobs`, request);
}
