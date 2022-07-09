import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { APIGatewayProxyResult } from 'aws-lambda';
import CommonService from './commonService';

const command = new ListObjectsV2Command({
    Bucket: process.env.UploadBucket,
    Delimiter: '/',
});

class ListFoldersService extends CommonService {
    private async getFolders(): Promise<string> {
        const listObjects = await this.client.send(command);

        const folders = listObjects.CommonPrefixes?.map((p) => p.Prefix?.replace(/\/$/, ''));

        return JSON.stringify({
            folders,
        });
    }

    async apiHandler(): Promise<APIGatewayProxyResult> {
        const folders = await this.getFolders();
        return {
            statusCode: 200,
            body: folders,
        };
    }
}

export const handler = new ListFoldersService().handler;
