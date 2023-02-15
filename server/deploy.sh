#!/usr/local/bin/bash
# NOTICE: Mac does not upgrade bash, so i have to install it manually with brew. Plz change the path to your own bash cli

# check & generate key pair if not exist
./createKeyPair.sh

# getEnv() {
#     grep $1 .env | cut -d'=' -f2- | tr -d '"'
# }

# readFileStr() {
#     local file=''
#     while IFS= read -r line; do
#         file="${file}${line}\n"
#     done < $1
#     echo ${file::-2}
# }

# KeyPairID=$(getEnv KeyPairID)
PublicKey=$(<.ssh/public_key.pem)
PrivateKey=$(<.ssh/private_key.pem)

sam deploy --parameter-overrides PublicKey="${PublicKey// /\\ }" PrivateKey="${PrivateKey// /\\ }" --resolve-image-repos --no-confirm-changeset

# export the API endpoint and S3 bucket
aws cloudformation list-exports > ../shared/server-output.json
cp ../shared/server-output.json ../app/src/api/server-output.json
