import { useState,useEffect } from 'react'
import socket from './socket';
function App(){
  const [emergencies,setEmergencies]=useState([]);
 useEffect(() => {
    //listening down the socket
    socket.on('connect',()=>{
      console.log('[Visualizer] Connected to Socket server with ID:', socket.id);
    })
    socket.on('emergency-update', (newDisasterNode) => {
      //a new distaster is directly stored in the array
      console.log('[Visualizer] Received Socket Event:', newDisasterNode);
      setEmergencies((prev) => [...prev, newDisasterNode]);
    });
return () => {
  socket.off('connect');
      socket.off('emergency-update');
      socket.off('disconnect');
    };
  }, []);

return(
  <div>
    <h1>HOPE</h1>
    <pre>{JSON.stringify(emergencies,null,2)}</pre>
  </div>
);
}
export default App
