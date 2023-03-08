import { PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import sharp from 'sharp';
import CommonService from './commonService';

const THUMBNAIL_HEIGHT = 200;

class UploadService extends CommonService {
    private generateFileKey(): { filePath: string; thumbnailFilePath: string } {
        const date = new Date();
        const folderName = `${date.getFullYear()}-${(date.getMonth() + 1).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
        })}`;
        const filename = Math.floor(+date / 1000);
        return {
            filePath: `${folderName}/${filename}.jpg`,
            thumbnailFilePath: `thumbnail-${folderName}/${filename}.jpg`,
        };
    }

    private async uploadToS3(filePath: string, buffer: Buffer) {
        const command = new PutObjectCommand({
            Bucket: process.env.UploadBucket,
            Key: filePath,
            ContentType: 'image/jpeg',
            Body: buffer,
        });
        const response = this.client.send(command);
        return response;
    }

    private async uploadFile(event: APIGatewayProxyEvent) {
        if (!event.body) {
            throw new Error('You must upload with a file');
        }

        let buffer = Buffer.from(event.body, 'base64');
        const contentType = event.headers['content-type'] || '';
        const image = sharp(buffer);
        if (/hei[c|f]$/.test(contentType)) {
            buffer = await image.toFormat('jpeg').toBuffer();
        }

        const { filePath, thumbnailFilePath } = this.generateFileKey();
        const resp = await this.uploadToS3(filePath, buffer);

        // calculate the thumbnail width according to original ratio
        const { width, height } = await image.metadata();
        const _w = width && height ? Math.round((width / height) * THUMBNAIL_HEIGHT) : THUMBNAIL_HEIGHT;

        const thumbnailBuffer = await image.resize(_w, 200).toBuffer();
        const thumbnail_resp = await this.uploadToS3(thumbnailFilePath, thumbnailBuffer);

        return {
            file: resp,
            thumbnail: thumbnail_resp,
        };
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
