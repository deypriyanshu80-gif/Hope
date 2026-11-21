import { useState,useEffect,useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import socket from './socket';
function App(){
  const [emergencies,setEmergencies]=useState([]);
  const incomingBuff=useRef([]);
useEffect(()=>{
  const onConnect=()=>{
    console.log("socket connected with ID :",socket.id);
  };
const onEmergency=(newDisaster)=>
{
  if(newDisaster)
    incomingBuff.current.push(newDisaster);
};
const onRes=({id})=>{
 incomingBuff.current= incomingBuff.current.filter((item)=>item._id!==id);  //removing it from the 1-s buffer
  setEmergencies((prev)=>prev.filter((item)=>item._id!==id));//remove its existence from the state
};
socket.on('connect',onConnect);
socket.on('emergency-update',onEmergency);
//observed and made effets after the emergency was resolved
socket.on('resolved',onRes);

const render=setInterval(()=>{
  if(incomingBuff.current.length>0)
  {
    const batch=[...incomingBuff.current];
    incomingBuff.current=[];
    setEmergencies((prev)=>
    {
      const clusterMap=new Map(prev.map((item)=>[item._id,item]));
      batch.forEach((node)=>{
        clusterMap.set(node._id,node);

      });
      return Array.from(clusterMap.values());//array with the node._ids
    })
  }
},1000)
return ()=>{
  socket.off('connect',onConnect);
  socket.off('emergency-update',onEmergency);
  socket.off('resolved',onRes);
  clearInterval(render);
}
},[]);
const handleResolve=async(id)=>
{
  if(!id)
    return;
  try
  {
    const response= await fetch(`http://localhost:3000/api/emergencies/${id}/resolve`,{
      method:'PATCH',
      headers:
      {
        'Content-type':'application/json',
      }

    }
    );
    if(!response.ok)
    {
      throw new Error(`Server responded with ${response.status}`);
    }
    console.log(`resolved cluster :${id}`);
  }
  catch(err)
  {
    console.error('Failed to resolve cluster:', err);
  };
}
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
                  <button onClick={()=>handleResolve(node._id)}
                    style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                     fontWeight: 'bold',
              width: '100%'
      }}>
        RESOLVE AND DISPATCH
      </button>
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
