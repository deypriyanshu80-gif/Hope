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
  <div style={{height:'100vh',width:'100vw'}}>
    <MapContainer
    center={[20.5937, 78.9629]} // Centered on India
    zoom={5} 
    style={{ height: '100%', width: '100%' }}>

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
