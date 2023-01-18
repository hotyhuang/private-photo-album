import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyResult } from 'aws-lambda';
import CommonService from './commonService';

class UploadSignedUrlService extends CommonService {
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

    public async apiHandler(): Promise<APIGatewayProxyResult> {
        const { uploadURL, Key } = await this.getUploadURL();

        console.log('Going to upload to ', uploadURL);

        return {
            statusCode: 200,
            body: JSON.stringify({ uploadURL, Key }),
        };
    }
}

export const handler = new UploadSignedUrlService().handler;
