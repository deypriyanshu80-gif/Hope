const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const emergencySchema=new Schema({
sourceId:{
type:String,
required:true,
},
timeStamp:{
type:Number,
required:true,
},
severity:{
type:String,
enum:['LOW','MEDIUM','HIGH','CRITICAL'],
required:true,
},
disaster_type:{
type:String,
reqired:true,
},
rawText:{
type:String,

},
location:{
    type:{
        type:String,
        enum:[Point],
        requored:true,
    },
    coordinates:{
        enum:['Number'],
        required:true
    },
},
})
emergencySchema.index({location:'2dsphere'});
module.exports=mongoose.model('Emergency',emergencySchema);