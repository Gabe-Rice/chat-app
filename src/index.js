const path = require('path'); // load path
const http = require('http');
const express = require('express'); // load express
const socketio = require('socket.io'); // load socket.io, returns function
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, getUser, getUsersInRoom, removeUser} = require('./utils/users');

const app = express(); // create app
// create server outside express to use express app, for socket.io setup
const server = http.createServer(app); 
const io = socketio(server); 

const port = process.env.PORT || 3000; // set port

const publicDirPath = path.join(__dirname, '../public'); // set public dir to serve
app.use(express.static(publicDirPath)); // serve public dir


// Server connection, runs for each connected client
io.on('connection', (socket) => { // listen for event, connection: fires when socket.io server gets new conn
    console.log('New WebSocket connection');

    // join chat session:
    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username, room});

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        // welcome message, new user message
        socket.emit('message', generateMessage('Admin', `Welcome ${user.username}`));
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined...`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback(); //let client know they were able to join
    })

    // send chat message to clients
    socket.on('sendMessage', (msgFromCli, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(msgFromCli)) {
            return callback('Profanity is discouraged and unbecoming!');
        }

        io.to(user.room).emit('message', generateMessage(user.username, msgFromCli)); // sends to all
        callback();
    })


    // send location of specified client
    socket.on('sendLocation', (location, callback) => { // get location
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`)); // send location
        callback();
    })


     // to notify when user disconnects
     socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left...`));
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }  
    })
})

server.listen(port, () => { // start server
    console.log(`Server is up on port ${port}`);
})


/* Notes:

- socket.emit:  sends to specific client
- io.emit:  sends to every connected client
- socket.broadcast.emit:  sends to every client except sender
- io.to.emit:  emits event to everyone in specific room
- socket.broadcast.to.emit:  sends to everyone but sender in specific room

*/