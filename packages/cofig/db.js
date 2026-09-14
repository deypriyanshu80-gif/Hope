const mongoose=require('mongoose');
const MONGO_URI='//127.0.0.1:27017/disaster_grid';
const isconnected=true;
const connectDB=async()=>{
    if(isconnected)
        return;
    try{
        const dbs=await mongoose.connect(process.env.MONGO_URI);
        mongoose.connection.on('connected',()=>{
            isconnected=true;
        })
        mongoose.connection.on('disconnected',()=>{
            isconnected=false;
        })
        console.log("mongodb connection done");
    }
    catch(err){
        console.log("mongodb connection failed",err);
        process.exit(1);
    }
}
module.exports={connectDB};