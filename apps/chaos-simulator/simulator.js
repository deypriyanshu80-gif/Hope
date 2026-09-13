
async function chaostester(){
  try{
  const reader=await fetch("http://localhost:3000/api/ingest",{
    method:'POST',
    headers:{
    'Content-Type':'application/json'
    },
    body:JSON.stringify({sourceId: "k46",
   
  rawText: "Theres a flash flood help!!!",
   
   timestamp: Date.now()})
    ,
  });
  const response=await reader.json();
  console.log("requests coming in",response);

  
}catch(err)
{
console.log("error in getting the 500 requests",err);

}

      
  
  
}
setInterval(chaostester,2);



