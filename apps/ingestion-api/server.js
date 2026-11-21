const { connectDB }= require('../../packages/cofig/db.js');
const Emergency = require('../../packages/shared-types/Emergency.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express=require('express');
const app = express();
//importing stuff for bullmq
connectDB();
//to allow the patch request
const cors = require('cors');
app.use(cors());

const {Server}=require('socket.io');

const http = require('http');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});




const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const {Queue,QueueEvents, Backoffs}=require('bullmq');
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
    const payload= req.body;
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
    const batch=jobBuffer.map(job=>({
        ...job,
        opts:{
            attempts:5,
            backoff:{
                type: 'exponential',
          delay: 2000
            },
            removeOnComplete: true,
        }
    }))
    jobBuffer=[];
    await jobDistress.addBulk(batch);//redis queue hochhe jobDistress
}
}//resolve messages logic
app.patch('/api/emergencies/:id/resolve',async(req,res)=>
{
try{
    const {id}=req.params;
const update=await Emergency.findByIdAndUpdate(id,
    {
        status:'RESOLVED',
    },
    {
        new:true,
    },

)
if(!update)
{
    return res.status(404).json({error:"Emergency cluster not found"});
}
io.emit('resolved',{id});//broadcasting to everyone else 
return res.status(200).json(update);

}
catch(err)
{
    console.log("error resolving the message:",err);
    return res.status(500).json({error:"Emergency cluster failed to resolve"});
}
})
const queueEvents=new QueueEvents('distress-events',{
    connection:sharedConnections, //no createWorkerConnection , since we are only shipping the data recceived by shared pipeline
})
queueEvents.on('completed',({jobId,returnvalue})=>{   //ISSUING A GLOBAL MESSAGE ABOUT THE COMPLETION OF JOB
    const parsedNode=typeof returnvalue=='string'?JSON.parse(returnvalue):returnvalue;
    console.log(`[Socket] broadcasting job ${jobId} to frontend`);
    io.emit('emergency-update',parsedNode);
})
setInterval((flushBuffer),100);  //100ms
const PORT = process.env.PORT || 3000;

//app.listen(PORT, () => {console.log(`Ingestion Engine running on port ${PORT}`);console.log(`Bull-Board GUI available at http://localhost:${PORT}/admin/queues`);});
server.listen(3000,()=>{
    console.log("Express + server.io listening on port 3000");
})

