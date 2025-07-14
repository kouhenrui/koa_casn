import Redis from "ioredis";
import { getRedisService, RedisService } from "./redis";


export class QueueService{
    private static instance: QueueService;
    private client:Redis

    private constructor(){
        this.client = getRedisService().getClient()
    }

    public static async getInstance(): Promise<QueueService> {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }

    public async addJob(queueName: string, jobData: any) {
        const job = await this.client.rpush(queueName, JSON.stringify(jobData));
        return job;
    }

    public async getJob(queueName: string) {
        const job = await this.client.lpop(queueName);
        return job;
    }

    async processJob(queueName?: string, callback?:(err:any)=>void) {
        if(queueName){
            const job = await this.client.blpop(queueName,0);
            if(job){
                callback(job);
            }else{
                callback(null);
            }
        }else{
            while(true){
                const job = await this.client.blpop(queueName,0);
                if(job){
                    callback(job);
                }else{
                    callback(null);
                }
            }
        }
       
    }
}