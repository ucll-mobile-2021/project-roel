const http = require('http').createServer();
const io = require('socket.io')(http, { cors: '*' })

let users = []

io.on('connection', socket => {
  console.log(`${socket.id} : connected`)

  socket.on('disconnect', () => {
    if (users)
    console.log(`${socket.id} : disconnected`)
    const disconnectedUser = findById(socket.id)
    if(!disconnectedUser) {
      return
    }
    const opponent = findByUsername(disconnectedUser.opponent)
    console.log(disconnectedUser, opponent)
    if(opponent) {
      io.to(opponent.id).emit('opponent-disconnect', disconnectedUser.username)
      setOpponent(opponent.id, '')
    }
    io.emit('user-disconnect', disconnectedUser.username)
    users = users.filter((user) => user.id !== socket.id)
    io.to(socket.id).emit('logout-success')
  })

  socket.on('join', (user) => {
    console.log(user)
    if(!validUsername(user.name)) {
      io.to(socket.id).emit('duplicate-username')
      return
    }

    validId(socket.id) ? users.push({id: socket.id, username: user.name, inProgress: false, opponent: '', city: user.city, latitude: user.latitude, longitude: user.longitude}) : users[users.map((u) => u.id).indexOf(socket.id)].username = user.name

    io.to(socket.id).emit('login-success', user.name)
    io.emit('user-connect', {name: user.name, city: user.city, longitude: user.longitude, latitude: user.latitude})
  })

  socket.on('update-location', (locationInformation) => {
    console.log(`${socket.id} : city: ${locationInformation.city}, latitude: ${locationInformation.latitude}, longitude: ${locationInformation.longitude} `)
    const user = findById(socket.id)
    users = users.map((user) => {
      if(user.id === socket.id) {
        return {id: user.id, username: user.username, inProgress: user.inProgress, opponent: user.opponent, city: locationInformation.city, latitude: locationInformation.latitude, longitude: locationInformation.longitude}
      }
      return user
    })
    io.emit('update-user', {name: user.username, city: locationInformation.city})
  })

  socket.on('get-online-users', () => {
    console.log(`${socket.id} : get-online-users`)
    io.to(socket.id).emit('online-users', users.filter((user) => user.id !== socket.id).map((user) => { return {name: user.username, city: user.city, longitude: user.longitude, latitude: user.latitude}}))
  })

  socket.on('make-move', (userMove) => {
    const move = userMove.move
    const target = findByUsername(userMove.opponent)
    if(!target) return
    io.to(target.id).emit('move-received', move)
  })

  socket.on('challenge', (username) => {
    const target = findByUsername(username)
    const user = findById(socket.id)
    console.log(`${user.id} : challenged ${target.id}`)
    if(!target || !user) return
    if(target.opponent !== '') io.to(socket.id).emit('challenge-denied')
    io.to(target.id).emit('challenge-received', user.username)
  })

  socket.on('challenge-accepted', (user) => {
    const challenged = findById(socket.id)
    const challenger = findByUsername(user)
    setOpponent(socket.id, user)
    setOpponent(challenger.id, challenged.username)
    console.log(findByUsername(user), findById(socket.id))
    console.log('lol')
    if(!challenger || !challenged) return
    io.to(challenged.id).emit('start-white')
    io.to(challenger.id).emit('challenge-accepted', challenged.username)
  })

  socket.on('challenge-denied', (user) => {
    const userObj = findByUsername(user)
    if(!userObj) return
    io.to(userObj.id).emit('challenge-denied')
  })

  socket.on('game-over', () => {
    setOpponent(socket.id, '')
    console.log(findById(socket.id))
  })
  
})


function setOpponent(id, opponent) {
  users = users.map((user) => {
    if(user.id === id) {
      return {id: user.id, username: user.username, inProgress: user.inProgress, opponent: opponent, city: user.city, latitude: user.latitude, longitude: user.longitude}
    }
    return user
  })
}

function validId(id) {
  const socketIds = users.map((user) => user.id)
  return !(socketIds.includes(id))
}

function validUsername(username) {
  const usernames = users.map((user) => user.username)
  return !(usernames.includes(username))
}

function findByUsername(username) {
  const user = users.find((user) => user.username === username)
  return user
}

function findById(id) {
  const user = users.find((user) => user.id === id)
  return user
}

http.listen(3000, '0.0.0.0');