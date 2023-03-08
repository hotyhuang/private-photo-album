import fetch, {RequestInit, Response} from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const email = process.env.EMAIL;
const password = process.env.PASSWORD;
const TADPOLES_DOMAIN = 'https://www.tadpoles.com';
const DAY = 24 * 3600 * 1e3;
const CONTENT_TYPE_SUFFIX = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'video/mp4': '.mp4',
    // 'application/pdf': '.pdf',
};
type ContentTypeTypes = keyof typeof CONTENT_TYPE_SUFFIX;
const Bucket = process.env.S3Bucket;

export class TadpolesCrawler {

    authCookie: string = '';

    s3 = new S3Client({ region: process.env.AWS_REGION });

    assets_options = {
        // keep in local storage
        local_keep: false,
        // upload to s3 bucket
        upload_s3: true,
    }

    constructor(local_keep?: boolean, upload_s3?: boolean) {
        if (local_keep !== undefined) {
            this.assets_options.local_keep = local_keep;
        }
        if (upload_s3 !== undefined) {
            this.assets_options.upload_s3 = upload_s3;
        }
    }

    private paramsToString(params: Object) {
        return Object.entries(params).map(([key, value]) =>    
            `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`
        ).join('&');
    }

    /**
     * internal fetch method of tadpoles url, using auth cookie after logged in
     * @param {string} path url path
     * @param {RequestInit} options 
     * @returns {Promise<Response>}
     */
    private async fetch(path: string, options?: RequestInit): Promise<Response> {
        const url = `${TADPOLES_DOMAIN}${path}`;
        const _options: RequestInit = {
            ...options,
            headers: {
                cookie: this.authCookie,
                ...options?.headers
            },
        };
        let response: Response;
        try {
            response = await fetch(url, _options);
        } catch (e) {
            console.error(`Fail in request path ${path}`, e);
            process.exit(1);
        }

        return response;
    }

    public async login() {
        const authBody = {
            email,
            password,
            server: 'tadpoles'
        };

        const formBody = this.paramsToString(authBody);

        const response = await this.fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody,
        });
        if (response.status >= 400) {
            console.error('Cannot login with the account and password');
            process.exit(1);
        }

        this.authCookie = response.headers.get('set-cookie') || '';

        console.log('Done login...');

        await this.enterAfterLogin();
    }

    private async enterAfterLogin() {
        const response = await this.fetch('/athome/enter');
        this.authCookie = response.headers.get('set-cookie') || '';

        console.log('Entered page...');
    }

    public async listAssets(start: string | number, end: string | number, cursor?: string) {
        if (typeof start === 'string') {
            start = Math.floor(+new Date(start) / 1000);
        }
        if (typeof end === 'string') {
            end = Math.floor(+new Date(end) / 1000);
        }
        const params: any = {
            direction: 'range',
            client: 'dashboard',
            earliest_event_time: start,
            latest_event_time: end,
            num_events: 300,
        };
        if (cursor) {
            params.cursor = cursor;
        }
        const response = await this.fetch(`/remote/v1/events?${this.paramsToString(params)}`);
        const data = await response.json();
        console.log(`Fetched assets from ${start} to ${end}`, data.events?.length);

        if (data.cursor?.length) {
            const nextData = await this.listAssets(start, end, data.cursor);
            data.events = [...(data.events || []), ...(nextData.events || [])];
            data.linked_events = [...(data.linked_events || []), ...(nextData.linked_events || [])];
        }

        return data;
    }

    public async listAssetsOfToday() {
        const idxOfDay = Math.floor(Date.now() / DAY);
        return await this.listAssets(idxOfDay * DAY / 1000, (idxOfDay + 1) * DAY / 1000);
    }

    private async loadOneAsset(
        key: string,
        obj: string,
        filename: string,
        isThumbnail?: boolean,
    ): Promise<{filePath: string; fileBuffer: Uint8Array; contentType: string;} | undefined> {
        const params: any = {
            key,
            obj,
        };

        if (isThumbnail) {
            params.thumbnail = true;
        }

        const response = await this.fetch(`/remote/v1/obj_attachment?${this.paramsToString(params)}`);
        const contentType = response.headers.get('content-type') as ContentTypeTypes;
        const suffix = CONTENT_TYPE_SUFFIX[contentType];

        // skip not needed file type, like pdf
        if (!suffix) {
            return;
        }

        const buffer = await response.arrayBuffer();
        const view = new Uint8Array(buffer);

        let filePath = './assets/' + filename + suffix;
        if (this.assets_options.local_keep) {
            if (isThumbnail) {
                filePath = './assets/thumbnail.' + filename + suffix;
            }
            console.log(`Writing to file ${filePath}...`);
            fs.writeFileSync(filePath, view);
        }

        return {
            filePath,
            fileBuffer: view,
            contentType,
        };
    }

    private async uploadToS3(
        asset: {filePath: string; fileBuffer: Uint8Array; contentType: string;},
        date: string,
        isThumbnail?: boolean,
    ): Promise<void> {
        if (!this.assets_options.upload_s3) {
            return;
        }

        const {filePath, fileBuffer, contentType} = asset;
        // use "YYYY-MM" as directory
        const month = /^\d{4}-\d{2}/.exec(date)?.[0] || '';
        const filename = (isThumbnail ? 'thumbnail-' : '') + month + '/' + path.basename(filePath);
        const cmd = new PutObjectCommand({
            Bucket,
            Key: filename,
            Body: fileBuffer,
            ContentType: contentType
        });
        try {
            console.log(`Uploading file ${filename} to s3 bucket...`);
            await this.s3.send(cmd);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    }

    public async loadAssetsInEvent(event: any) {
        if (this.assets_options.local_keep && !fs.existsSync('./assets')) {
            fs.mkdirSync('./assets');
        }

        const {attachments, key, event_date} = event;
        let filename = `${event.create_time}`;
        for (let i = 0 ; i < attachments?.length ; i++) {
            if (i > 0) {
                filename += i;
            }
            const asset = await this.loadOneAsset(attachments[i], key, filename);

            if (asset) {
                await this.uploadToS3(asset, event_date);

                // all the assets here should have thumbnail available
                // including content-type: jpg, png, video
                const thumbnail_asset = await this.loadOneAsset(attachments[i], key, filename, true);
                if (thumbnail_asset) {
                    await this.uploadToS3(thumbnail_asset, event_date, true);
                }
            }
        }
    }

    public async loadAllAssets(start: string | number, end: string | number) {
        const {events} =  await this.listAssets(start, end);
        for (let i = 0 ; i < events?.length ; i++) {
            await this.loadAssetsInEvent(events[i]);
        }
    }

    public async loadAllAssetsOfToday() {
        const {events} =  await this.listAssetsOfToday();
        for (let i = 0 ; i < events?.length ; i++) {
            await this.loadAssetsInEvent(events[i]);
        }
    }

    public async start() {
        await this.login();
        await this.loadAllAssetsOfToday();
    }

    public async startRunDuring(start: string | number, end: string | number) {
        await this.login();

        if (typeof start === 'string') {
            start = Math.floor(+new Date(start) / 1000);
        }
        if (typeof end === 'string') {
            end = Math.floor(+new Date(end) / 1000);
        }
        // 15 days
        const ELAPSE = 15 * DAY / 1e3;
        // load assets for 15 days, and loop so on until end
        let t = start;
        while (t < end) {
            await this.loadAllAssets(t, Math.min(t + ELAPSE, end));
            t += ELAPSE;
        }
    }
}
