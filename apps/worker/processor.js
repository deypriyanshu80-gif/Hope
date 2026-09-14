const {sharedConnections,createWorkerConnections}=require('../../packages/cofig/redis.js');
const {Worker}=require('bullmq');
const Groq=require('groq-sdk');
const groq=new groq({
    apikey:process.env.GROQ_API_KEY,
})
//distress-events=queue name
//process-distress=individual job name
//job is passed as an object, jobBuffer cannot be passed, job represents an individual job
const newWorker=new Worker('distress-events',{connection:createWorkerConnections()},async(job)=>{
    const txt=job.data.rawText;
    const chatCompletions=await groq.chat.completions.create({
        messages:[
            {
                role:'system',
                
      content: `You are an emergency triage parser. Extract spatial and severity data from unstructured distress messages.
        You MUST output raw JSON matching this schema:
    {
    "location_name": string,
    "latitude": number,
    "longitude": number,
    "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "disaster_type": string
    }`,
            },
            {
                role:'user',
                content:txt,

            }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature:0.1,
        response_format:{type:'json_object'},
    })

    // we need to get the correct json text from gorq to move further so,
    const rawContent=chatCompletions.choices[0].message?.content;
    const parsedData = JSON.parse(rawContent);
    return parsedData;
})
newWorker.on('completed',(job,returnvalue)=>{
 console.log(`[Worker Success] Job #{job.id} parsed:`,returnvalue);
  });
 newWorker.on('failed',(job,err)=>{
    console.log(`[Worker Failiure] Job #{job.id}:`,err);


})
console.log('AI worker is running....');
   
