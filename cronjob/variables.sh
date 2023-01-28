#!/usr/local/bin/bash

AWS_REGION=$(aws configure get region)

S3_BUCKET=$(aws cloudformation list-exports --query "Exports[?Name == 'private-photo-album-s3bucket'].Value | [0]")

if [[ ${S3_BUCKET} == "null" ]];then
    echo '''
Warning: Please deploy server to aws lambda first!
    '''
    exit 1;
fi

S3_BUCKET=${S3_BUCKET//\"/}