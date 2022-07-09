import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyResult } from 'aws-lambda';
import CommonService from './commonService';

class UploadService extends CommonService {
    private generateFileKey(): string {
        const date = new Date();
        const folderName = `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
        })}`;
        return `${folderName}/${+date}.jpg`;
    }

    private async getUploadURL(): Promise<{ uploadURL: string; Key: string }> {
        const Key = this.generateFileKey();

        const command = new PutObjectCommand({
            Bucket: process.env.UploadBucket,
            Key,
            ContentType: 'image/jpeg',
        });

        const uploadURL = await getSignedUrl(this.client, command, { expiresIn: 300 });

        return {
            uploadURL,
            Key,
        };
    }

    // private async uploadFile(event: APIGatewayProxyEvent) {
    //     if (!event.body) {
    //         throw new Error('You must upload with a file');
    //     }

    //     const Key = this.generateFileKey();

    //     const command = new PutObjectCommand({
    //         Bucket: process.env.UploadBucket,
    //         Key,
    //         ContentType: 'image/jpeg',
    //         Body: Buffer.from(event.body, 'base64'),
    //     });
    //     const response = this.client.send(command);
    //     return response;
    // }

    public async apiHandler(): Promise<APIGatewayProxyResult> {
        const { uploadURL, Key } = await this.getUploadURL();

        console.log('Going to upload to ', uploadURL);

        // const response = await this.uploadFile(event);

        return {
            statusCode: 200,
            body: JSON.stringify({ uploadURL, Key }),
        };
    }
}

export const handler = new UploadService().handler;
