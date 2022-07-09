import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import authService from './authService';

interface ListResponse {
    URLs: string[];
}

interface UploadResponse {
    uploadURL: string;
    Key: string;
}

class PhotoService {
    instance: AxiosInstance;
    constructor() {
        this.instance = axios.create({
            baseURL: 'https://r3bvkv7sp4.execute-api.us-east-1.amazonaws.com',
            timeout: 10 * 1000,
        });
        this.instance.interceptors.request.use(this.beforeSent);
        this.instance.interceptors.response.use(this.beforeReceive, this.beforeErrorResponse);
    }

    private beforeSent(config: AxiosRequestConfig) {
        // Do something before request is sent
        config.params = authService.params;
        return config;
    }

    private beforeReceive(response: AxiosResponse) {
        // Do something with response data
        return response;
    }

    private beforeErrorResponse(error: AxiosError) {
        if (error.code === 'ERR_BAD_REQUEST') {
            return Promise.reject(error.response?.data);
        }
        return Promise.reject(error);
    }

    public async list(req?: AxiosRequestConfig): Promise<ListResponse> {
        const resp = await this.instance.get('/list', req);
        return resp.data;
    }

    public async listFolders(req?: AxiosRequestConfig): Promise<{folders: string[]}> {
        const resp = await this.instance.get('/list/folders', req);
        return resp.data;
    }

    public async getPhotos(folder: string, req?: AxiosRequestConfig): Promise<{URLs: string[]}> {
        const resp = await this.instance.get(`/list/${folder}/photos` , req);
        return resp.data;
    }

    private async getUploadUrl(req?: AxiosRequestConfig): Promise<UploadResponse> {
        const resp = await this.instance.get('/upload', req);
        return resp.data;
    }

    public async upload(file: File, req?: AxiosRequestConfig): Promise<Response> {
        const {uploadURL} = await this.getUploadUrl(req);

        const buffer = await file.arrayBuffer();

        if (/.heic$/i.test(file.name)) {
            console.log('Yo need to convert heic');
        }

        const bytes = new Uint8Array(buffer);
        const blobData = new Blob([bytes], {type: file.type});

        const resp = await fetch(uploadURL, {
            method: 'PUT',
            body: blobData
        });
        if (resp.status >= 400) {
            throw new Error(`Cannot upload photos. Status: ${resp.statusText}.`);
        }
        return resp;
    }

    public async bulkUpload(files: File[], req?: AxiosRequestConfig): Promise<{
        status: number;
        type: 'fail' | 'partial' | 'success';
        numOfFailed?: number;
    }> {
        let numOfFailed = 0;
        for (let i = 0 ; i < files.length ; i++) {
            const file = files[i];

            try {
                await this.upload(file, req);
            } catch (err) {
                numOfFailed++;
            }
        }

        if (numOfFailed === files.length) {
            throw new Error('Upload has been failed.');
        }
        if (numOfFailed > 0) {
            return {status: 500, type: 'partial', numOfFailed};
        }
        return {status: 200, type: 'success'}
    }
};

export default new PhotoService();
