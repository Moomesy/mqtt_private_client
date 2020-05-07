"use strict";
import { connect, MqttClient } from 'mqtt';
import MyStorage from './storage';

interface Resp {
    data: any,
    time: number
}
type RespSuccess = (resp: Resp) => void
type RespParser = (resp: string) => any
type RespFail = (error: Error) => void
interface OriginRespCallback {
    onMessage: (resp: string) => void
}
interface RespCallback {
    success: RespSuccess,
    fail: RespFail,
    parser: RespParser,
    startTime: number
}
interface Config {
    hosts: Array<string>,
    token: string,
    userName: string,
    passWord: string
}
interface Request {
    msgId: string,
    token: string,
    url: string,
    parameter: Map<string, any>,
    tiemOut: number,
    json: boolean,
    header: {
        uToken: string,
        msgId: string
    }
}



class MQTT {
    protected client: MqttClient = null
    protected config: Config
    protected responseTopic = ""
    protected subscribedTopics: Map<string, OriginRespCallback> = new Map()
    protected callbackScratchStacks: Map<string, RespCallback> = new Map()
    protected msgIdAutoIncrement = 0
    protected storage: MyStorage

    _generateMsgId() {
        let dt = new Date().getTime();
        let result = [
            (parseInt(dt.toString().split('').reverse().join('')) + dt).toString(36),
            (++this.msgIdAutoIncrement).toString(36)
        ];
        return result.join('-').toUpperCase();
    }
    onError: (err: Error) => {}
    constructor(_config: Config, cachePrefix: string) {
        this.config = _config
        this.storage = new MyStorage(localStorage, cachePrefix)
    }
    init() {
        return new Promise((resolve, reject) => {
            console.log("MQTT：开始初始化", new Date().getTime())
            const servers = this.config.hosts.map(c => ({
                host: c.split(':')[0],
                port: c.split(':')[1]
            }));
            this.responseTopic = `mq/response/${this.config.token}`;
            this.client = connect({
                protocol: 'mqtt',
                username: this.config.userName,
                password: this.config.passWord,
                servers
            })
            this.client.on('connect', () => {
                this.client.subscribe(this.responseTopic, (err) => {
                    err ? reject(err) : resolve()
                    console.log("MQTT：初始化完成", new Date().getTime())
                })
            });
            // this.client.on("error", mqtt.onError)

            this.client.on('message', function (topic: string, buffer: Buffer) {
                const message = buffer.toString();
                if (topic === this.responseTopic) {

                    let data = null;
                    const response = JSON.parse(message);
                    const msgId = response.msgId;
                    if (!this.callbackScratchStacks.has(msgId)) {
                        return;
                    }
                    const success = this.callbackScratchStacks.get(msgId).success;
                    const fail = this.callbackScratchStacks.get(msgId).fail;
                    const parser = this.callbackScratchStacks.get(msgId).parser;
                    const time = new Date().getTime() - this.callbackScratchStacks.get(msgId).startTime;
                    this.callbackScratchStacks.delete(msgId);
                    try {
                        data = parser ? parser(response) : response;
                        success({ data, time });
                    } catch (e) {
                        fail(e);
                    }
                } else if (this.subscribedTopics.has(topic)) {// TODO 其他业务需求
                    this.subscribedTopics.get(topic).onMessage(message);
                } else { // EventBus
                    // 
                }
            })
        })
    }
    registerTopicHandle(topic: string) {
        return new Promise((resolve, reject) => {
            this.client.subscribe(topic, (err) => {
                console.log("registerTopicHandle订阅成功", topic)
                if (err) {
                    reject(err);
                } else {
                    const subscribeClient: OriginRespCallback = {
                        onMessage: (_message: string) => { }
                    }
                    this.subscribedTopics.set(topic, subscribeClient);
                    resolve(subscribeClient);
                }
            })
        })
    }
    // 结构 http://192.168.0.10:8800/demo/request
    request({ url = '' as string, parameter = null as Map<string, any>, parser = null as RespParser, json = false, tiemOut = 30000 }) {
        const topic = 'mq/request';
        const uToken = '';
        const msgId = this._generateMsgId();
        if (!this.client) {
            return Promise.reject(Error("MQTT Client is not initialized!"))
        }
        return new Promise((resolve, reject) => {
            this.callbackScratchStacks.set(msgId, {
                success: resolve,
                fail: reject,
                parser,
                startTime: new Date().getTime()
            })
            // 超时设置
            setTimeout(() => {
                this.callbackScratchStacks.has(msgId) && this.callbackScratchStacks.delete(msgId);
                reject(Error("服务器无应答"))
            }, tiemOut);
            this.publish({
                topic,
                message: {
                    msgId,
                    token: this.config.token,
                    url,
                    parameter,
                    tiemOut,
                    json,
                    header: {
                        uToken,
                        msgId
                    }
                }
            })
        })
    }
    publish({ topic = "" as string, message = {} as Request }) {
        this.client.publish(topic, JSON.stringify(message), {
            qos: 2
        })
    }
}


export default MQTT;