import { google } from "googleapis";

// See https://stackoverflow.com/a/43645891
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json",
  scopes: ["https://www.googleapis.com/auth/userinfo.profile"],
});

var oauth2 = google.oauth2({
  auth: auth,
  version: "v2",
});

oauth2.userinfo.v2.me.get(function (err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(res);
  }
});