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

EMAIL=$EMAIL PASSWORD=$PASSWORD npm run verify:auth

if [ $? != 0 ]; then                   
   echo "Exiting the process as the authentication failed...". 1>&2 && exit 1
fi

sam deploy --parameter-overrides AUTHEMAIL="$EMAIL" AUTHPWD="$PASSWORD" --s3-bucket "$S3_BUCKET" --stack-name "photo-album-cronjob" --capabilities CAPABILITY_IAM
