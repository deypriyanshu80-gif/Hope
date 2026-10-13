import { useState,useEffect,useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import socket from './socket';
function App(){
  const [emergencies,setEmergencies]=useState([]);
  const incomingBuff=useRef([]);
 useEffect(() => {
    //listening down the socket
    socket.on('connect',()=>{
      console.log('[Visualizer] Connected to Socket server with ID:', socket.id);
    })
    socket.on('emergency-update', (newDisasterNode) => {
      //a new distaster is directly stored in the array
      if(newDisasterNode)
      {
        incomingBuff.current.push(newDisasterNode);    //icomingBuff is an object not an array , current is the array in incomBuff
                                                      //we hence push the new disaster info to incomingBuff.current.push and not directly to
                                                      //incomingBuff
        
      }

      console.log('[Visualizer] Received Socket Event:', newDisasterNode);
      
    });
    const render=setInterval(()=>{
      if(incomingBuff.current.length>0)
      {
        setEmergencies((prev) => [...prev,...incomingBuff.current]); //appending to the existing useState with newDisasterNpde from incomingBuff
        incomingBuff.current=[]; //clearing the buffer
      }
    },1000)
return () => {
  socket.off('connect');
      socket.off('emergency-update');
      socket.off('disconnect');
      clearInterval(render);
    };
  }, []);

return(
  <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, position: 'absolute', top: 0, left: 0 }}>
    
    
    <MapContainer
    center={[20.5937, 78.9629]} // Centered on India
    zoom={5} 
    style={{ height: '100vh', width: '100vw' }}>

      <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
          />
          {
            emergencies.map((node,idx)=>{
              if(!node?.location?.coordinates)
                return null;
              const [lng,lat]=node.location.coordinates;
              return(
                <Marker key={node._id || idx} position={[lat, lng]}>
              <Popup>
                <strong>{node.disaster_type || 'Emergency'}</strong><br />
                Severity: {node.severity}<br />
                Reports: {node.incident_count}
              </Popup>
            </Marker>
              )
            })
          }
    </MapContainer>
  </div>
);
}
export default App
