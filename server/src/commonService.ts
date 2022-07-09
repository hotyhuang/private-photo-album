import { S3Client } from '@aws-sdk/client-s3';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ENABLE_QUESTIONAIRE_ACCESS, ANSWERS } from './constants';

export default abstract class CommonService {
    client: S3Client;

    constructor() {
        this.client = new S3Client({ region: process.env.AWS_REGION });
        this.handler = this.handler.bind(this);
    }

    protected isAuthorized(event: APIGatewayProxyEvent): boolean {
        if (!ENABLE_QUESTIONAIRE_ACCESS) {
            return true;
        }
        const _answers = event.queryStringParameters || {};
        const pass = Object.entries(ANSWERS).every(([question, ans]) =>
            ans.includes(decodeURIComponent(_answers[question] as string)),
        );
        return pass;
    }

    public abstract apiHandler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;

    public async handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
        if (!this.isAuthorized(event)) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    message: 'Your answers are incorrect',
                }),
            };
        }

        try {
            return await this.apiHandler(event);
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'Something wrong.',
                    error: JSON.stringify(err),
                }),
            };
        }
    }
}
