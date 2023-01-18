import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
// import heicConvert from 'heic-convert';
// import gm from 'gm';
import CommonService from './commonService';

class UploadService extends CommonService {
    private generateFileKey(): string {
        const date = new Date();
        const folderName = `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
        })}`;
        return `${folderName}/${+date}.jpg`;
    }

    // private async getUploadURL(): Promise<{ uploadURL: string; Key: string }> {
    //     const Key = this.generateFileKey();

    //     const command = new PutObjectCommand({
    //         Bucket: process.env.UploadBucket,
    //         Key,
    //         ContentType: 'image/jpeg',
    //     });

    //     const uploadURL = await getSignedUrl(this.client, command, { expiresIn: 300 });

    //     return {
    //         uploadURL,
    //         Key,
    //     };
    // }

    private async uploadFile(event: APIGatewayProxyEvent) {
        if (!event.body) {
            throw new Error('You must upload with a file');
        }

        const buffer = Buffer.from(event.body, 'base64');
        // if (/heic$/.test(event.headers['content-type'] as string)) {
        //     console.log('Encounter a heic file!!');
        //     buffer = Buffer.from(
        //         await heicConvert({
        //             buffer,
        //             format: 'JPEG',
        //         }),
        //     );
        //     // buffer = await sharp(buffer).toFormat('jpeg').toBuffer();
        //     // const convertHeic = new Promise((res: (buf: Buffer) => void, rej) => {
        //     //     gm.subClass({ imageMagick: true })(buffer).toBuffer('JPEG', (err, _buf) => {
        //     //         if (err) {
        //     //             console.log(err);
        //     //             rej(err);
        //     //         }
        //     //         res(_buf);
        //     //     });
        //     // });
        //     // buffer = await convertHeic;
        // }

        const Key = this.generateFileKey();
        const command = new PutObjectCommand({
            Bucket: process.env.UploadBucket,
            Key,
            ContentType: 'image/jpeg',
            Body: buffer,
        });
        const response = this.client.send(command);
        return response;
    }

    public async apiHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        // const { uploadURL, Key } = await this.getUploadURL();

        // console.log('Going to upload to ', uploadURL);

        const response = await this.uploadFile(event);

        return {
            statusCode: 200,
            body: JSON.stringify({ response }),
        };
    }
}

export const handler = new UploadService().handler;
