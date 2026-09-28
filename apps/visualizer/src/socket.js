import {io} from 'socket.io-client';
const socket=io('http://localhost:3000'); //singleton connection made to express so react does open a different socket for each distress call
export default socket; // the react components have to share this