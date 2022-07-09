#!/bin/bash

if [[ -z $1 || -z $2 ]]; then
    echo '''
Warning: Please follow the below instruction and use this command properly

Usage: ./upload-image-to-s3.sh [files_location] [s3_bucket]

Commands:
files_location   - can be relative or absolute folder/file path, this will read all image files under this path, so choose carefully...
s3_bucket        - the bucket you use to store all the photos
'''
    exit 1;
fi

FOLDER=$1
S3_BUCKET=$2

# check if bucket exist
echo "Checking S3 bucket exists..." 
bucketstatus=$(aws s3api head-bucket --bucket "${S3_BUCKET}" 2>&1)
if echo "${bucketstatus}" | grep 'Not Found';
then
  echo "bucket doesn't exist";
  exit 1;
elif echo "${bucketstatus}" | grep 'Forbidden';
then
  echo "Bucket exists but not owned"
  exit 1;
elif echo "${bucketstatus}" | grep 'Bad Request';
then
  echo "Bucket name specified is less than 3 or greater than 63 characters"
  exit 1;
else
  echo "Bucket owned and exists";
fi

# list all images by folder path
getCompatibleImageFiles() {
    find $FOLDER -type f -print0 |
        xargs -0 file --mime-type |
        grep -F 'image/' | grep -wv 'HEIC' |
        cut -d ':' -f 1
}

# list all incompatible images by folder path
getIncompatibleImageFiles() {
    find $FOLDER -type f -print0 |
        xargs -0 file --mime-type |
        grep -F 'image/' | grep 'HEIC' |
        cut -d ':' -f 1
}

# display creation time of a file in format 'YYYY-MM'
# $1 - file path
getCreationDate() {
    stat -f %SB -t %Y-%m $1
}

# upload one file to aws s3 bucket
# $1 - file path
# $2 - file creation date
uploadFileToS3() {
    aws s3 cp $1 "s3://${S3_BUCKET}/$2/"
}

# upload compatible files
FILES=$(getCompatibleImageFiles)
for FILE in $FILES; do
    uploadFileToS3 $FILE $(getCreationDate $FILE)
done

# upload incompatible files
# IMPORTANT: HEIC file convert only works for MacOS right now, need to enhance this to support other OS
INCOM_FILES=$(getIncompatibleImageFiles)
if [[ -n $INCOM_FILES ]]; then
    if ! command -v magick &> /dev/null
    then
        echo "magick could not be found"
        brew install imagemagick
    fi

    cd $FOLDER
    # convert any HEIC image in a directory to jpg format
    magick mogrify -monitor -format jpg *.HEIC
    cd -

    for INCOM_FILE in $INCOM_FILES; do
        new_file_name="${INCOM_FILE/HEIC/jpg}"
        uploadFileToS3 $new_file_name $(getCreationDate $new_file_name)
    done
fi

echo "Upload done."
