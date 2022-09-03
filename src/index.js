const express = require('express')
const http = require('http')
const path = require('path')
const socketIo = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')

const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

 
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

const PORT = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")


app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    console.log(`New web connection socket`) 


    socket.on('join', ( options, callback ) => {
        const { error, user } = addUser( { id: socket.id, ...options } )
        if (error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', "Welcome !"))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })



    socket.on('sendMessage', (msg, callback) => {

        const filter = new Filter()
        if (filter.isProfane(msg)) {
            return callback('Cannot send profanity words')
        }
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        callback()
    })




    socket.on('sendLocation', (data, callback) => {

        const user = getUser(socket.id)
        console.log(user.username)

        const url = `https://google.com/maps?q=${data.lat},${data.lon}`

        io.to(user.room).emit('locationMessage', generateLocationMessage( user.username, url))

        callback()
    })
 



    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`) )
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
        
    })

    

})

server.listen(PORT, () => {
    console.log(`Server up at port: ${PORT}`);
})