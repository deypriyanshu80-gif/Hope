const express=require('express');
const app = express();
//importing stuff for bullmq
const http=require('http');
const {Server}=require('socket.io');
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const {Queue,QueueEvents}=require('bullmq');
const {sharedConnections}=require('../../packages/cofig/redis.js');
app.use(express.json());
//instantiating jobDistress queue
const jobDistress=new Queue('distress-events',{connection:sharedConnections});
const serverAdapter=new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
//Connect the bull interface to Bullmq
createBullBoard({
    queues:[new BullMQAdapter(jobDistress)],
    serverAdapter:serverAdapter,

})
//mounting the bull interface to express
app.use('/admin/queues', serverAdapter.getRouter());
let jobBuffer=[];

app.post('/api/ingest',async(req,res)=>{
    const payload=await req.body;
    const labelledJobs={
        name:'process-distress',
        data:payload,
    }
    jobBuffer.push(labelledJobs);
    res.status(202).json({status:'queued'});
})
async function flushBuffer(){
if(jobBuffer.length>0)
{
    const batch=jobBuffer;
    jobBuffer=[];
    await jobDistress.addBulk(batch);
}
}
const queueEvents=new QueueEvents('distress-events',{
    connection:sharedConnections, //no createWorkerConnection , since we are only shipping the data recceived by shared pipeline
})
queueEvents.on('completed',({jobId,returnValue})=>{   //ISSUING A GLOBAL MESSAGE ABOUT THE COMPLETION OF JOB
    console.log(`[Socket] broadcasting job #{jobId} to frontend`);
    io.emit('emergency-bang',returnValue);
})
setInterval((flushBuffer),100);  //100ms
const PORT = process.env.PORT || 3000;
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"}});
//app.listen(PORT, () => {console.log(`Ingestion Engine running on port ${PORT}`);console.log(`Bull-Board GUI available at http://localhost:${PORT}/admin/queues`);});
server.listen(3000,()=>{
    console.log("Express + server.io listening on port 3000");
})

