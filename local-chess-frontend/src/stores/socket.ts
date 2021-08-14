import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

export const useSocketStore = defineStore({
  id: "socketStore",
  state: () => ({
    socket: io('http://localhost:3000', {autoConnect: true}),
    loggedIn: false,
    username: '',
    opponent: '',
    gameInProgress: false,
    color: 'black'
  }),
  actions: {
    getOpponent() {
      return this.opponent
    }
  }
})