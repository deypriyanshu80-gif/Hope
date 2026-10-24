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
    })
return (
  <div style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', margin: 0, height: '100vh', width: '100vw' }}>
    
    {/* Sidebar */}
    <div style={{ 
      width: '320px',
      backgroundColor: '#16171d', 
      color: '#f3f4f6', 
      padding: '20px',
      boxSizing: 'border-box',
      borderRight: '1px solid #2e303a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '24px', margin: '0 0 20px 0', borderBottom: '1px solid #2e303a', paddingBottom: '10px' }}>
        Triage Command
      </h1>
      
      <div style={{ backgroundColor: '#1f2028', padding: '15px', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Active Clusters</h2>
        <p style={{ fontSize: '32px', margin: 0, fontWeight: 'bold', color: '#c084fc' }}>
          {emergencies.length}
        </p>
      </div>

      {/* Intelligence Feed */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px', paddingRight: '5px' }}>
        {emergencies.slice(-20).reverse().map((node, idx) => (
          <div key={node._id || idx} style={{ backgroundColor: '#1f2028', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', textTransform: 'uppercase', fontSize: '14px' }}>
              {node.disaster_type || 'UNKNOWN ALERT'}
            </h3>
            <h3 style={{ margin: '0 0 8px 0', color: (node.severity === 'CRITICAL' || node.severity === 'HIGH') ? '#ef4444' : '#fbbf24', fontSize: '12px' }}>
              Severity: {node.severity}
            </h3>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px', lineHeight: '1.4' }}>
              {node.rawText}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Map Container Wrapper (Flexbox handles the sizing automatically) */}
    <div style={{ flex: 1, height: '100vh', margin: 0, padding: 0 }}>
      <MapContainer
        center={[20.5937, 78.9629]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {
          emergencies.map((node, idx) => {
            if (!node?.location?.coordinates) return null;
            const [lng, lat] = node.location.coordinates;
            return (
              <Marker key={node._id || idx} position={[lat, lng]}>
                <Popup>
                  <strong>{node.disaster_type || 'Emergency'}</strong><br />
                  Severity: {node.severity}<br />
                  Reports: {node.incident_count}
                </Popup>
              </Marker>
            );
          })
        }
      </MapContainer>
    </div>

  </div>
);
 
}
export default App;
