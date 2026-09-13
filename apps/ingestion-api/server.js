const express=require('express');
const app = express();
//importing stuff for bullmq
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const {Queue}=require('bullmq');
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
setInterval((flushBuffer),100);  //100ms
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ingestion Engine running on port ${PORT}`);
  console.log(`Bull-Board GUI available at http://localhost:${PORT}/admin/queues`);
});

