#!/usr/local/bin/bash

source ./variables.sh
source ./authInput.sh

dateReg='^[12][09][0-9][0-9]-[01][0-9]-[0-3][0-9]$'

while ! [[ $startDate =~ $dateReg ]];
do
    read -p 'Enter start date (YYYY-MM-DD): ' startDate
done

while ! [[ $endDate =~ $dateReg ]];
do
    read -p 'Enter end date (YYYY-MM-DD): ' endDate
done

npm run compile

S3Bucket=$S3_BUCKET AWS_REGION=$AWS_REGION EMAIL=$EMAIL PASSWORD=$PASSWORD startDate=$startDate endDate=$endDate node -r dotenv/config dist/local.js