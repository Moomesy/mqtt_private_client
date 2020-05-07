"use strict";
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as qs from 'qs';

// create an axios instance
const axiosClient = axios.create({ baseURL: "", timeout: 1000 * 60 });

interface Config extends AxiosRequestConfig {
    fullResponse: boolean,
    originResponse: boolean
}

interface Response extends AxiosResponse {
    config: Config
}

// 请求拦截器
const requestFulfilled = (config: Config) => {
    if (config.method.toLowerCase() !== 'post' || typeof config.data === 'string') {
        return config;
    }
    if (config.headers.get('Content-Type') === 'application/json') {
        if (typeof config.data !== 'string') {
            config.data = JSON.stringify(config.data)
        }
        return config;
    }
    if (!config.data) {
        config.data = {};
    }

    if (config.headers.get('Content-Type') === 'multipart/form-data') {
        let data = new FormData(); //创建form对象
        Object.keys(config.data).forEach(itm => {
            if (!config.data[itm]) {
                return;
            }
            if (typeof config.data[itm] === "object" && config.data[itm].length) {
                for (let i = 0; i < config.data[itm].length; i++) {
                    data.append(`${itm}[${i}]`, config.data[itm][i]);
                }
            } else {
                data.append(itm, config.data[itm]);
            }
        });
        config.data = data;
    } else {
        config.data = qs.stringify(config.data, {
            allowDots: true,
            skipNulls: true
        });
    }
    return config
};
const requestRejected = (error: Error) => {
    console.log(error); // for debug
    return Promise.reject(error)
};

// 响应适配器
const responseParse = (resp: AxiosResponse) => {
    const body = resp.data;
    return body;
}

// 响应拦截器
const responseFulfilled = (resp: Response) => {
    if (resp.config.fullResponse) {
        return Promise.resolve(resp);
    }
    if (resp.config.responseType === 'blob' || resp.config.originResponse) {
        return Promise.resolve(resp.data);
    }

    try {
        return Promise.resolve(responseParse(resp))
    } catch (e) {
        return Promise.reject(e)
    }
};
const responseRejected = (_error: Error) => { };

axiosClient.interceptors.request.use(requestFulfilled, requestRejected);
axiosClient.interceptors.response.use(responseFulfilled, responseRejected);

const http = {
    async get(url: string, params: Map<string, any> = {} as Map<string, any>, config: Config = {} as Config) {
        return axiosClient.get(url, {
            params,
            ...config
        } as Config)
    },
    async post(url: string, data: Map<string, any> = {} as Map<string, any>, config:Config = {} as Config) {
        return axiosClient.post(url, data, {
            ...config
        } as Config)
    }

}
export {
    http
}