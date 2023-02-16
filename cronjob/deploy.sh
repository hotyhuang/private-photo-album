#!/usr/local/bin/bash

source ./variables.sh
source ./authInput.sh

sam deploy --parameter-overrides AUTHEMAIL="$EMAIL" AUTHPWD="$PASSWORD" --s3-bucket "$S3_BUCKET" --stack-name "photo-album-cronjob" --capabilities CAPABILITY_IAM
