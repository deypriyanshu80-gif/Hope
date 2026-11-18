const SCENARIOS = [
  { sourceId: "wb-kol", rawText: "Severe waterlogging and flash flood near Salt Lake Sector V, Kolkata! People stranded." },
  { sourceId: "uk-josh", rawText: "SOS landslide blocking highway near Joshimath, Uttarakhand, multiple vehicles trapped!" },
  { sourceId: "mh-mum", rawText: "Building collapse reported in Dharavi, Mumbai after heavy rain, urgent rescue needed." },
  { sourceId: "tn-che", rawText: "Cyclone storm surge flooding Marina Beach road in Chennai, power lines down." },
  { sourceId: "as-guw", rawText: "Brahmaputra river overflowing in Guwahati, Assam, residential colony submerged." },
  { sourceId: "gj-bhuj", rawText: "Strong earthquake tremors felt in Bhuj, Gujarat, cracks in old buildings." },
  { sourceId: "kl-way", rawText: "Heavy mudslide in Wayanad, Kerala, families cut off near Meppadi." },
  { sourceId: "dl-yam", rawText: "Yamuna water level rising fast near ITO Delhi, low-lying shelters evacuating." }
];

async function chaostester(){
  try{
  const reader=Array.from({length:5}).map((_,i)=>{
    const scene=SCENARIOS[Math.floor(Math.random()*SCENARIOS.length)];
  return  fetch("http://localhost:3000/api/ingest",{
    method:'POST',
    headers:{
    'Content-Type':'application/json'
    },
    body:JSON.stringify({sourceId:`${scene.sourceId}-${Date.now()}-${i}`,
   
  rawText: scene.rawText,
   
   timestamp: Date.now()
  })
    ,
  })
  })
  const response=await Promise.all(reader);  //fetch everything at the same time , in this case , batch of 50 alerts
  console.log("Intercepted 500 requests at 1 sec");

  
}catch(err)
{
console.log("error in getting the 50 requests",err);

}

      
  
  
}
setInterval(chaostester,2000);



