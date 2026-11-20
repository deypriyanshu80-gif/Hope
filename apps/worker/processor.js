const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
//require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

//console.log("DEBUG API KEY:", process.env.GROQ_API_KEY);
const mongoose=require('mongoose');
const {connectDB}=require('../../packages/cofig/db');


const {sharedConnections,createWorkerConnections}=require('../../packages/cofig/redis.js');
const {Worker}=require('bullmq');
const ngeohash = require('ngeohash');
const Emergency = require('../../packages/shared-types/Emergency');
const Groq=require('groq-sdk');
const groq=new Groq({
    apiKey:process.env.GROQ_API_KEY,
});
//distress-events=queue name
//process-distress=individual job name
//job is passed as an object, jobBuffer cannot be passed, job represents an individual job
(async()=>{
    try{
        await connectDB();
        console.log("[Worker] DB connection established...");
const newWorker=new Worker('distress-events',async(job)=>{
    const txt=job.data.rawText;
    let parsedData;
    try{
    const chatCompletions=await groq.chat.completions.create({
      messages: [
  {
    role: 'system',
    content: `You are a machine data extractor. Extract spatial and severity data from unstructured distress messages. 
    You MUST output ONLY raw, valid JSON. DO NOT wrap the response in markdown blocks or backticks. DO NOT include conversational text.
    Schema:
    {
      "location_name": "string",
      "latitude": 0.0,
      "longitude": 0.0,
      "severity": "LOW",
      "disaster_type": "string"
    }`
  },
  {
    role: 'user',
    content: txt
  }
],
        model: 'openai/gpt-oss-20b',
        temperature:0.1,
        response_format:{type:'json_object'},
    })

    // we need to get the correct json text from gorq to move further so,
    const rawContent=chatCompletions.choices[0].message?.content;
     parsedData = JSON.parse(rawContent);
    }
catch(aiError){
console.log(`[Worker] Groq API Failed: ${aiError.message}`);
const lower=txt.toLowerCase();
let severity="MEDIUM";
if(lower.includes("trapped")||lower.includes("sos")||lower.includes("flood")||lower.includes("collapse"))
{
    severity="HIGH";
}
const FALLBACK_HUBS = [
    { match: "kolkata", name: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, type: "Flash Flood" },
    { match: "uttarakhand", name: "Joshimath, Uttarakhand", lat: 30.5506, lng: 79.5660, type: "Landslide" },
    { match: "mumbai", name: "Mumbai, Maharashtra", lat: 19.0760, lng: 72.8777, type: "Structural Collapse" },
    { match: "chennai", name: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, type: "Cyclone Surge" },
    { match: "assam", name: "Guwahati, Assam", lat: 26.1445, lng: 91.7362, type: "River Flood" },
    { match: "gujarat", name: "Bhuj, Gujarat", lat: 23.2420, lng: 69.6669, type: "Earthquake" },
    { match: "kerala", name: "Wayanad, Kerala", lat: 11.6854, lng: 76.1320, type: "Mudslide" },
    { match: "delhi", name: "New Delhi", lat: 28.6139, lng: 77.2090, type: "Flood Alert" }
  ];
  const finder=FALLBACK_HUBS.find(h=>lower.includes(h.match))||FALLBACK_HUBS[Math.floor(Math.random()*FALLBACK_HUBS.length)];
parsedData={
    location_name: finder.name,
           latitude: finder.lat,
            longitude:finder.lng ,
            severity: severity,
            disaster_type: finder.type,
};
};
    const lat= typeof parsedData.latitude=='number'?parsedData.latitude:20.5937;
    const lng=typeof parsedData.longitude=='number'?parsedData.longitude:78.9629; 
    const gridId=ngeohash.encode(lat,lng,7);
     const EmergencyNode=await Emergency.findOneAndUpdate(
        //searching of the grid
        {
            geohash:gridId,
        },
        {
         
                     $inc:{
                incident_count:1,
            },
            $set:{
                status:'ACTIVE',
            },
            //occurs if the grid does not exist,creates a brand new cluster
            $setOnInsert:{
                sourceId:job.data.sourceId,
                rawText:job.data.rawText,
                timestamp:job.data.timestamp,
                severity:parsedData.severity,
                disaster_type:parsedData.disaster_type,
                location:{
                    type:'Point',
                    coordinates:[lng,lat],
                }
                
            }
    },
{
    upsert:true,  
    returnDocument:'after'
    //new:true,
},   
    );

 return EmergencyNode;

   
},
{
    connection:createWorkerConnections()
    });//newWorker closed
newWorker.on('completed',(job,returnvalue)=>{
 console.log(`[Worker Success] Job #{job.id} parsed:`,returnvalue);
  });
 newWorker.on('failed',(job,err)=>{
    console.log(`[Worker Failiure] Job #{job.id}:`,err);


})
console.log('AI worker is running....');
   
}

catch(err){
    console.log("[Worker] fatal error :",err)


    }

})()


