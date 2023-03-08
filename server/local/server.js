/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getSignedUrl: getCloudfrontSignedUrl } = require('@aws-sdk/cloudfront-signer');

const server_output = require('../../shared/server-output.json');

const Bucket = server_output.Exports.find((obj) => obj.Name === 'private-photo-album-s3bucket')?.Value;

dotenv.config();

const app = express();

const client = new S3Client();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/list/folders', async (req, res) => {
    const command = new ListObjectsV2Command({
        Bucket,
        Delimiter: '/',
        // Prefix: 'thumbnail-',
    });

    const data = await client.send(command);
    res.send(data);
});

app.get('/list/:folder/photos', async (req, res) => {
    const ContinuationToken = req.query.ContinuationToken ? decodeURIComponent(req.query.ContinuationToken) : undefined;
    const command = new ListObjectsV2Command({
        Bucket,
        Delimiter: '/',
        Prefix: req.params?.folder + '/',
        MaxKeys: 3,
        ContinuationToken,
    });

    try {
        const data = await client.send(command);
        res.send(data);
    } catch (err) {
        res.status(404);
        res.send('Token is not right');
    }
});

app.get('/upload', async (req, res) => {
    const command = new PutObjectCommand({
        Bucket,
        Key: '12314234.jpg',
        ContentType: 'image/jpeg',
    });

    const uploadURL = await getSignedUrl(client, command, { expiresIn: 300 });
    res.send(uploadURL);
});

app.put('/upload', async (req, res) => {
    console.log(req.body);
    res.send('yoyo');
});

// test async process
let reqIndex = 1;
app.get('/test', async (req, res) => {
    res.send({ message: 'yo started' });

    const reqID = reqIndex++;
    console.log(`Request NO ${reqID} start`, Date.now());
    setTimeout(() => {
        console.log(`Request NO ${reqID} completed`, Date.now());
    }, 5000);
});

app.get('/photo', (req, res) => {
    const cloudfrontDistributionDomain = process.env.CDNDomain;
    const s3ObjectKey = '2021-03/SNPUI.png';
    const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
    const privateKey = fs.readFileSync('.ssh/private_key.pem', 'utf8');
    const keyPairId = process.env.KeyPairID;
    const dateLessThan = '2022-10-01'; // any Date constructor compatible

    const signedUrl = getCloudfrontSignedUrl({
        url,
        keyPairId,
        dateLessThan,
        privateKey,
    });

    console.log(signedUrl);
    res.send(signedUrl);
});

app.listen(8081, (err) => {
    console.log('Server started on http://localhost:8081');
});
