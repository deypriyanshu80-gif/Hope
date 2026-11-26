import React ,{useState} from "react";
const CMD="GRID-CMD-2026";
function Login({children})
{
    const[username,setUsername]=useState("");
    const[password,setPassword]=useState(CMD);
    const[error,setError]=useState("");
    const[operator,setOperator]=useState(()=>{
        sessionStorage.getItem("grid-operator")||null
    });
    const handleSubmit=(e)=>{
        e.preventDefault();
        if(username.trim()!="")
        {
            setError("Set a username ffs");
            return;
        }
        if(password.trim()!=CMD)
        {
            setError("INCORRECT,ACCESS DENIED");
            return;
        }
        const name=username.trim();
        sessionStorage.setItem("grid-operator",name);
        setOperator(name);
        setUsername("");
        setError("");
    };
    if(!operator)
    {
        return(
            <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f1117",
        color: "#f3f4f6",
        fontFamily: "sans-serif"
      }}>
                <form onSubmit={handleSubmit}
                style={{
            backgroundColor: "#181a20",
            padding: "32px",
            borderRadius: "10px",
            border: "1px solid #2d313e",
            width: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}> 
                    <h3
                    style={{ margin: 0 }}>
                         WELCOME TO HOPE </h3>
                       
                        <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
                            Admin Dispatch Portal
                             </p>
                            <input type="text" 
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                            placeholder="Enter username"
                            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #374151",
              backgroundColor: "#0f1117",
              color: "#fff"
            }}/>
                            <input type="text"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            placeholder="Enter passcode"
                            style={{
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #374151",
              backgroundColor: "#0f1117",
              color: "#fff"
            }} />

                      {error&&( <span
                      style={{ color: "#ef4444", fontSize: "13px" }}>{error}</span>
                      )} 
                   <button
                   type="submit"
                   style={{
              padding: "10px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer"
            }}>

                  ENTER
                   </button>
                </form>
            </div>
        )
    }
return children;
}
export default Login;