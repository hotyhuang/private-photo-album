#!/bin/bash

if [[ ! -e ".ssh" ]]; then
    echo "Creating the credential folder..."
    mkdir .ssh
fi

if [[ ! -e ".ssh/private_key.pem" ]]; then
    echo "Cannot find private key, generating..."
    openssl genrsa -out .ssh/private_key.pem 2048
fi

if [[ ! -e ".ssh/public_key.pem" ]]; then
    echo "Cannot find public key, generating..."
    openssl rsa -pubout -in .ssh/private_key.pem -out .ssh/public_key.pem
fi
