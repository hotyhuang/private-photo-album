import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import CommonService from './commonService';

const HOUR = 3600 * 1e3;
const DAY = 24 * HOUR;

class ListPhotosService extends CommonService {
    private getExpireDate(): string {
        const _expire = new Date((Math.floor((Date.now() + HOUR) / DAY) + 1) * DAY);
        // only format 'YYYY-MM-DD' will get to UTC time
        return `${_expire.getUTCFullYear()}-${_expire.getUTCMonth() + 1}-${_expire.getUTCDate()}`;
    }

    private getDistributionUrl(s3ObjectKey: string): string {
        return `https://${process.env.UploadCDN}/${s3ObjectKey}`;
    }

    private async getPhotosUrl(folder = '', event: APIGatewayProxyEvent): Promise<string> {
        const ContinuationToken = event.queryStringParameters?.continuationToken
            ? decodeURIComponent(event.queryStringParameters?.continuationToken)
            : undefined;
        const isThumbnail = event.queryStringParameters?.thumbnail === 'true';

        const command = new ListObjectsV2Command({
            Bucket: process.env.UploadBucket,
            Delimiter: '/',
            Prefix: `${isThumbnail ? 'thumbnail-' : ''}${folder}/`,
            MaxKeys: 50,
            ContinuationToken,
        });
        const listObjects = await this.client.send(command);

        // @todo debug level log
        const allKeys = new Set(listObjects.Contents?.map((content) => content.Key));

        // remove the folder itself
        allKeys.delete(`${folder}/`);

        const dateLessThan = this.getExpireDate();

        // @todo - can we not use the pre-signed URL to get the photos?
        const allSignedUrls: string[] = [];

        for (const _key of allKeys) {
            if (!_key) {
                continue;
            }

            const signedUrl = getSignedUrl({
                url: this.getDistributionUrl(_key),
                keyPairId: process.env.KEY_PAIR_ID as string,
                dateLessThan,
                privateKey: process.env.PRIVATE_KEY as string,
            });
            allSignedUrls.push(signedUrl);
        }

        return JSON.stringify({
            URLs: allSignedUrls,
            isTruncated: listObjects.IsTruncated,
            continuationToken: listObjects.NextContinuationToken,
        });
    }

    public async apiHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        const folder = event.pathParameters?.folder;
        const photos = await this.getPhotosUrl(folder, event);
        return {
            statusCode: 200,
            body: photos,
        };
    }
}

export const handler = new ListPhotosService().handler;
