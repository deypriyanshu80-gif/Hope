
async function chaostester(){
  try{
  const reader=Array.from({length:50}).map(()=>
   fetch("http://localhost:3000/api/ingest",{
    method:'POST',
    headers:{
    'Content-Type':'application/json'
    },
    body:JSON.stringify({sourceId: "k46",
   
  rawText: "Theres a flash flood help!!!",
   
   timestamp: Date.now()
  })
    ,
  })
)
  const response=await Promise.all(reader);  //fetch everything at the same time , in this case , batch of 50 alerts
  console.log(`Blasted ${response.length} requests at once`);

  
}catch(err)
{
console.log("error in getting the 500 requests",err);

}

      
  
  
}
setInterval(chaostester,1000);



