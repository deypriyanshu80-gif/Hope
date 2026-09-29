import { useState,useEffect } from 'react'
import socket from './socket';
function App(){
  const [emergencies,setEmergencies]=useState([]);
 useEffect(() => {
    //listening down the socket
    socket.on('emergency-update', (newDisasterNode) => {
      //a new distaster is directly stored in the array
      setEmergencies((prev) => [...prev, newDisasterNode]);
    });
return () => {
      socket.off('emergency-update');
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
