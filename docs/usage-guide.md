## Problems with SEEK applicant alerts and JazzHR

When using JazzHR's email for SEEK job applicant alerts, duplicate JazzHR applicants are sometimes created. When an applicant applies with a resume + cover letter, JazzHR assumes each attachment is a new candidate, creating a duplicate applicant.

While duplicate applicants can be fixed in JazzHR, fixing involves alot of manual work, increasing load on the HR team.

# Using seek2jazz

## Step 1. Getting the JazzHR job code

1. Log into JazzHR, 
2. Select the job you want to link
3. Click "ADVERTISE" on the toolbar
4. Jump to "CUSTOM LINK"
5. Click "CREATE JOB LINK"
6. Extract the JazzHR job code from the url. The job code are unique characters. 
For example, for the link:

`https://teremtechnologiessandbox.applytojob.com/apply/EB8yru5vhf/Sample-Job`

The job code is `EB8yru5vhf`

## Step 2. Setting up the SEEK ad

1. Log into SEEK
2. Select the SEEK ad you want to setup
3. Paste the job code into the internal reference field
4. Send the email alerts to:

`job.applications@terem.com.au`

Done!

# Testing seek2jazz via forwarding
At times it might be useful to test seek2jazz with individual emails. Todo this, forward a SEEK applicant alert to `job.applications@terem.com.au` with the job code in the email subject.

The email subject should be in the form of: 
`Fwd: Application received for Senior Drupal Engineer ref: <Job Code>`

where `<Job Code>` is replaced with the JazzHR job code

