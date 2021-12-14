import axios, { AxiosInstance } from "axios";

let axiosInstance: AxiosInstance;

function getAxiosInstance(): AxiosInstance {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL: process.env.JAZZHR_BASE_URL,
      params: {
        apikey: process.env.JAZZHR_API_KEY,
      },
    });
  }
  return axiosInstance;
}

export async function getApplicants(): Promise<any> {
  const response = await getAxiosInstance().get("/applicants");
  console.log(response.data);
  return response;
}
