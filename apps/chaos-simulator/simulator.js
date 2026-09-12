
async function chaostester(){
  try{
  const reader=await fetch("http://localhost:3000/api/ingest",{
    method:'POST',
    header:{
    'Content-Type':'application/json'
    },
    body:JSON.stringify({sourceId: "k46",
   
  rawText: "Theres a flash flood help!!!",
   
   timestamp: Date.now()})
    ,
  });
   res.status(202).json({message:'coming in'}); 
  
}catch(err)
{
console.log("error in getting the 500 requests",err);
res.status(400).json({message:' error in getting 500 requests in'});
}

      
  
  
}
setInterval(chaostester,2);



