interface ApplicantPostRequest {
  first_name: string;
  last_name: string;
  email: string;
  apikey: string;
}

interface ApplicantPostResponse {
  prospect_id: string;
}
