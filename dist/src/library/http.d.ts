import { AxiosRequestConfig, AxiosResponse } from 'axios';
interface Config extends AxiosRequestConfig {
    fullResponse: boolean;
    originResponse: boolean;
}
declare const http: {
    get(url: string, params?: Map<string, any>, config?: Config): Promise<AxiosResponse<any>>;
    post(url: string, data?: Map<string, any>, config?: Config): Promise<AxiosResponse<any>>;
};
export { http };
