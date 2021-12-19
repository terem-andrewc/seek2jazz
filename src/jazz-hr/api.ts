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
