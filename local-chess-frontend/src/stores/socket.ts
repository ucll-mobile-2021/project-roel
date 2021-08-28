import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore({
  id: "socketStore",
  state: () => ({
    socket: io(process.env.VUE_APP_SOCKET, {autoConnect: true}),
    loggedIn: false,
    username: '',
    opponent: '',
    gameInProgress: false,
    color: 'black',
    latitude: 0.0,
    longitude: 0.0
  }),
  actions: {
    getOpponent() {
      return this.opponent
    }
  }
})