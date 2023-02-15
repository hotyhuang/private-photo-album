# aws-lambda-s3
This folder creates a cronjob. Currently it will grab assets from tadpoles.com, and push to aws s3 on every weekday.

## Pre-requisites
- deploy the [server](../server/)
- You must use account + password to login to Tadpoles, please follow the instructions in [tadpoles-backup](https://github.com/leocov-dev/tadpoles-backup/blob/main/.github/GoogleAccountSignIn.md).

## Commands

|script|description|
|---|---|
|`npm start`| run the job in local machine, with entered start date and end date |
|`npm run build`| build codes in container |
|`npm run deploy`| build the codes and deploy to aws |

## References
