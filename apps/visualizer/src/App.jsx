import { useState,useEffect,useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup,CircleMarker,useMap } from 'react-leaflet';
import socket from './socket';
function MapFlyController({target}){
  const map=useMap();
  useEffect(()=>{
    if(!target)
    {
      return;
      } 
       map.flyTo(target,13,{duration:1.2});
    
  },[target,map]) //triggered by target(change in target) , map exists.

}
function App(){
  const [emergencies,setEmergencies]=useState([]);
  const incomingBuff=useRef([]);
  const[selectedCoords,setSelectedCoords]=useState(null);
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
const refresh=async()=>{
  try{
  const response =await fetch('http://localhost:3000/api/emergencies')
  if(!response.ok)
    throw new Error(`http error ${response.status}`);
  const history=await response.json();
setEmergencies((prev)=>{
  const mergedMap=new Map(history.map((item=>[item._id,item])));
  prev.forEach((liveItem)=>{
    mergedMap.set(liveItem._id,liveItem);

  }
)
return Array.from(mergedMap.values());
})
  }
  catch(err)
  {
console.error('[Visualizer] Failed to hydrate emergencies:', err);
  }
}
refresh();
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

//to recognise the scale of a disater by looking at its marker
const SEVERITY_COLORS = {
  CRITICAL: '#ef4444', // Crimson Red
  HIGH: '#f97316',     // Tactical Orange
  MEDIUM: '#eab308',   // Warning Yellow
  LOW: '#3b82f6',      // Info Blue
};
const recognise=(node)=>
{
  const level=(node.severity||'MEDIUM').toUpperCase();
  const color=SEVERITY_COLORS[level]||'#eab308';
  const radius = Math.min(8 + (node.incident_count || 1) * 1.5, 32);
  return { color, radius };
}
return (
  <div style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden', margin: 0, height: '100vh', width: '100vw' }}>
    
   
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

      
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px', paddingRight: '5px' }}>
        {emergencies.slice(-20).reverse().map((node, idx) => (
          <div key={node._id || idx}
          onClick={()=>{
            if(node?.location?.coordinates)
            {
              const [lng,lat]=node.location.coordinates;
              setSelectedCoords([lat,lng]);
            }
          }} 
          style={{ 
            backgroundColor: '#1f2028', 
            padding: '15px', 
            marginBottom: '10px', 
            borderRadius: '8px' 
            }}>
            <h3 style={{
               margin: '0 0 8px 0', 
               color: '#f8fafc', 
               textTransform: 'uppercase',
                fontSize: '14px' }}>
              {node.disaster_type || 'UNKNOWN ALERT'}
            </h3>
            <h3 style={{
               margin: '0 0 8px 0', 
               color: (node.severity === 'CRITICAL' || node.severity === 'HIGH') ? '#ef4444' : '#fbbf24', 
               fontSize: '12px' }}>
              Severity: {node.severity}
            </h3>
            <p style={{ 
              margin: 0,
               color: '#9ca3af', 
               fontSize: '13px', 
               lineHeight: '1.4' }}>
              {node.rawText}
            </p>
          </div>
        ))}
      </div>
    </div>

    
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
      
        <MapFlyController target={selectedCoords}/>
        //
        {
          emergencies.map((node, idx) => {
            if (!node?.location?.coordinates) return null;
            const [lng, lat] = node.location.coordinates;
            const {color,radius}=recognise(node);
            return (
              <CircleMarker key={node._id || idx}
               center={[lat, lng]}
               radius={radius}
               pathOptions={{
                color: color,       //outer border ring color
                fillColor: color,   //inner circle fill color
                fillOpacity: 0.65,  //translucent so overlapping zones stay visible
                weight: 2,          //border thickness in pixels
                }}>
                <Popup>
                  <strong>{node.disaster_type || 'Emergency'}</strong><br />
                  Severity: {node.severity}<br />
                  Reports: {node.incident_count}
                  <button onClick={()=>{
                  e.stopPropagation();//prevents bubbling up to the parent marker
                  handleResolve(node._id)
                  }}
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
              </CircleMarker>
            );
          })
        }
      </MapContainer>
    </div>

  </div>
);
 
}
export default App;
