const Redis=require('ioredis');
const redisOptions = {
  host: '127.0.0.1', 
  port: 6379,
  maxRetriesPerRequest: null, // Critical for BullMQ
};
const sharedConnections=new Redis(redisOptions);
const createWorkerConnections=()=>new Redis(redisOptions);
module.exports={sharedConnections,createWorkerConnections};