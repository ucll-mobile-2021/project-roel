<template>
  <ion-page>
    <div v-if="socketStore.gameInProgress">
      <ion-title id="opponent" size="large">Opponent: {{ socketStore.opponent }}</ion-title>
    </div>
    <div v-else id="noShowDiv">
        <p size="large" id="middleTitle">
          No ongoing game found. <br><br>Go to the "Find an opponent" tab to look for a game.
        </p>
    </div>
    <div v-bind:class="{ notInProgress: !socketStore.gameInProgress }" id="board1"> </div>
    <div v-if="socketStore.gameInProgress">
      <ion-title class="turn" id="myTurn" size="large" v-if="myTurn">Your turn to move</ion-title>
      <ion-title class="turn" size="large" v-else>Opponents turn to move</ion-title>  
    </div>
  </ion-page>
</template>

<script lang="ts">
import ChessBoard from 'chessboardjs-vue'
import Chess from 'chess.js'
import { ref, onMounted, computed } from 'vue'
import { useSocketStore } from '../stores/socket'
import { alertController, toastController } from '@ionic/vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ChessBoardImplementation',
  setup() {
    const socketStore = useSocketStore()

    const router = useRouter()

    let board;
    const game = new Chess()

    const gameStatus = ref<string>('')
    const myTurn = ref<boolean>(false)

    const gameOverToast = async (text) => {
      const toast = await toastController.create({
            message: text || 'Game over, board will be cleared',
            color: 'success',
            position: 'middle',
            buttons: [
              {
                text: 'Ok',
                handler: () => {
                  socketStore.opponent = ''
                  socketStore.gameInProgress = false
                  socketStore.color = 'black'
                  game.reset()
                  board.position(game.fen())
                }
              }
            ]
          })
      toast.present()
    }

    const updateStatus = async () => {
        let status = ''
        let toMove = 'White'
        myTurn.value = (game.turn() === 'b' && socketStore.color === 'black') || (game.turn() === 'w' && socketStore.color === 'white')
        console.log(game.turn(), socketStore.color)
        if (game.turn() === 'b') toMove = 'Black'
        if (game.in_checkmate()) {
          gameStatus.value = `Game over, ${toMove} is in checkmate.`
          let text = ''
          toMove === 'White' ? text = 'White' : text = 'Black'
          text += ' got checkmated, board will be cleared.'
          socketStore.socket.emit('game-over')
          await gameOverToast(text)
          return   
        }

        if (game.in_draw()) {
          gameStatus.value = 'Game over, game is a draw.'
          await gameOverToast('Draw, board will be cleared')
          return
        }

        status = `${toMove} to move`
        if(game.in_check()) status += `, ${toMove} is in check.`
        gameStatus.value = status

      }

      function init(orientation) {
        const config = {
          position: 'start',
          draggable: true,
          onDragStart: (source, piece, position, orientation) => {
            if(game.game_over()) return false
            if((game.turn() === 'w' && socketStore.color !== 'white') || (game.turn() === 'b' && socketStore.color !== 'black')) return false

            // only pick up pieces for the side to move
            if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
                (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
              return false
            }
          },
          onDrop: (source, target) => {
            // see if the move is legal
            const move = game.move({
              from: source,
              to: target,
              promotion: 'q' // NOTE: always promote to a queen for example simplicity
            })

            // illegal move
            if (move === null) return 'snapback'

            socketStore.socket.emit('make-move', {opponent: socketStore.opponent, move})
            updateStatus()
          },
          onSnapEnd: () => {board.position(game.fen())},
          orientation: orientation
        }

      board = ChessBoard('board1', config)

      updateStatus()
    }

    socketStore.socket.on('move-received', (move) => {
      game.move(move)
      board.position(game.fen())
      updateStatus()
    })

    socketStore.socket.on('challenge-accepted', (user) => {
      socketStore.gameInProgress = true
      socketStore.opponent = user
      socketStore.color = 'black'
      init(socketStore.color)
      game.reset()
      board.position(game.fen())
      console.log(board.orientation)
      router.push('/tabs/chessboard')
    })

    socketStore.socket.on('challenge-denied', async () => {
      socketStore.opponent = ''
      socketStore.gameInProgress = false
      socketStore.color = 'black'
      game.reset()
      board.position(game.fen())
      const alert = await alertController.create({
        header: 'Challenge denied',
        message: 'Your challenge has been denied.',
        buttons: [
          {
            text: 'Ok',
          }
        ]
      })
      alert.present()
    })

    socketStore.socket.on('opponent-disconnect', async (username) => {
      socketStore.opponent = '' 
      socketStore.gameInProgress = false
      socketStore.color = 'black'
      game.reset()
      board.position(game.fen())
      const alert = await alertController.create({
        header: 'Opponent disconnected',
        message: 'Your opponent ' + username + ' has disconnected.',
        buttons: [
          {
            text: 'Ok'
          }
        ]
      })
      alert.present()
    })

    socketStore.socket.on('start-white', () => {
      console.log('white start')
      socketStore.color = 'white'
      init(socketStore.color)
    })

    onMounted(() => {
      init(socketStore.color)
    })

    return { gameStatus, socketStore, myTurn }
  },
}
</script>

<style scoped>
  #myTurn {
    color: rgb(7, 200, 7);
  }
  .turn {
    margin-top: 1rem;
    text-align: center;
  }
  #opponent {
    font-size: 1.2rem !important;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  #board1 {
    margin: auto;
  }
  .notInProgress {
    display: none;
    width: 0%;
  }

  #noShowDiv {
    min-height: 100%;
  }

  #noShowDiv.container {
    display: table-cell !important;
    vertical-align: middle !important;
  }
  
  #middleTitle {
    margin: auto;
    width: 100%;
    height: 100%;

    font-family: Roboto;
    font-size: 1.2rem;
    text-align: center;
    color: #f0e10f;

    position:fixed;
    top: 42.5%;
  }
</style>
