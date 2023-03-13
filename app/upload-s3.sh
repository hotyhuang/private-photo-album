#!/bin/bash

# Enter your s3 bucket, which hosting the web app
YOUR_S3_BUCKET=

aws s3 rm "s3://${YOUR_S3_BUCKET}/" --recursive --exclude "index.html"

aws s3 cp ./dist/ "s3://${YOUR_S3_BUCKET}/" --recursive
