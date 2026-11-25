import React ,{useState} from "react";
const CMD=aaa;
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
    }

}