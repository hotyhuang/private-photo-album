#!/usr/local/bin/bash

source ./variables.sh

# Plz add your own login cridentials!!!
while [[ -z $EMAIL ]];
do
    read -p 'Enter your tadpoles email: ' EMAIL
done

while [[ -z $PASSWORD ]];
do
    read -sp 'Enter your password: ' PASSWORD
done

sam deploy --parameter-overrides S3Bucket="$S3_BUCKET" AUTHEMAIL="$EMAIL" AUTHPWD="$PASSWORD" --s3-bucket "$S3_BUCKET" --stack-name "photo-album-cronjob" --capabilities CAPABILITY_IAM
