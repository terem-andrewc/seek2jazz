interface ApplicantPostRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  apikey: string;
  "base64-resume": string;
}

interface ApplicantPostResponse {
  prospect_id: string;
}
