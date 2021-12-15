import axios, { AxiosInstance } from "axios";

function getAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: process.env.JAZZHR_BASE_URL,
    params: {
      apikey: process.env.JAZZHR_API_KEY,
    },
  });
}

export async function getApplicants(): Promise<any> {
  const response = await getAxiosInstance().get("/applicants");
  return response.data;
}

export async function getJobs(): Promise<any> {
  const response = await getAxiosInstance().get("/jobs");
  return response.data;
}

export async function getApplicantsByName(name: string): Promise<any> {
  const response = await getAxiosInstance().get(
    `/applicants/name/${encodeURIComponent(name)}`
  );
  return response.data;
}
