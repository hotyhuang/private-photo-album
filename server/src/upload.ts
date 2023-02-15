import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';
import CommonService from './commonService';

class UploadService extends CommonService {
    private generateFileKey(): string {
        const date = new Date();
        const folderName = `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
        })}`;
        const filename = Math.floor(+date / 1000);
        return `${folderName}/${filename}.jpg`;
    }

    private async uploadFile(event: APIGatewayProxyEvent) {
        if (!event.body) {
            throw new Error('You must upload with a file');
        }

        let buffer = Buffer.from(event.body, 'base64');
        const contentType = event.headers['content-type'] || '';
        if (/hei[c|f]$/.test(contentType)) {
            buffer = await sharp(buffer).toFormat('jpeg').toBuffer();
        }

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
        const response = await this.uploadFile(event);

        return {
            statusCode: 200,
            body: JSON.stringify({ response }),
        };
    }
}

export const handler = new UploadService().handler;
