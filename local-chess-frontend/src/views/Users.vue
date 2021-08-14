<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title color="button">Find an opponent</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-list-header>
        <ion-label class="subLabel">Online users</ion-label>
      </ion-list-header>
      <ion-grid>
        <div v-if="onlineUsers.length === 0">
          <ion-item style="font-size: .9rem;">No other users online.</ion-item>
        </div>
        <ion-list v-for="user in onlineUsers" :key="user">
          <ion-item>
            <ion-row class="ion-align-items-center ion-justify-content-center">
              <ion-col size="6" class="ion-align-self-center" >
                <span class="loggedIn">●</span>{{ user }}
              </ion-col>
              <ion-col size="6" class="ion-align-self-center">
                <ion-button class="challengeButton" color="button" :disabled="!loggedIn" @click="challenge(user)">Challenge</ion-button>
              </ion-col>
            </ion-row>
          </ion-item>
        </ion-list>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonLabel, IonItem, IonButton, IonListHeader, IonList, toastController, alertController } from '@ionic/vue';
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useSocketStore } from '../stores/socket'

export default  {
  name: 'Users',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage, IonLabel, IonItem, IonButton, IonListHeader, IonList, IonGrid},
  setup() {
    const socketStore = useSocketStore()

    const router = useRouter()
    
    const onlineUsers = ref<Array<string>>([])
    const username = ref<string>(socketStore.username)
    const loggedIn = ref<boolean>(socketStore.loggedIn)

    socketStore.socket.emit('get-online-users')

    const challenge = (username) => {
      socketStore.socket.emit('challenge', username)
    }

    socketStore.socket.on('challenge-received', async (user: string) => {
      console.log(`Challenge received from ${user}`)
      if(socketStore.gameInProgress) {
        socketStore.socket.emit('challenge-denied', user)
        return
      }
      const alert = await alertController.create({
        header: 'Challenge received',
        message: 'Challenge received from ' + user + ', you will be white.',
        buttons: [
          {
            text: 'Accept',
            handler: accept => {
              console.log('accepted')
              socketStore.gameInProgress = true
              socketStore.opponent = user
              socketStore.color = 'white'
              socketStore.socket.emit('challenge-accepted', user)
              router.push('/tabs/chessboard')
            }
          },
          {
            text: 'Deny',
            role: 'cancel',
            handler: deny => {
              socketStore.socket.emit('challenge-denied', user)
            }
          }
        ]
      })
      alert.present()
    })

    socketStore.socket.on('challenge-accepted', (user) => {
      socketStore.gameInProgress = true
      socketStore.opponent = user
      socketStore.color = 'black'
      router.push('/tabs/chessboard')
    })

    socketStore.socket.on('online-users', users => {
      onlineUsers.value = users.filter((user) => user !== username.value)
    })

    socketStore.socket.on('user-disconnect', (oldUser: string) => {
      if (socketStore.opponent === oldUser) { 
        socketStore.opponent = '' 
        socketStore.gameInProgress = false
      }
      onlineUsers.value = onlineUsers.value.filter((user) => user !== oldUser)
    })

    socketStore.socket.on('user-connect', (newUser: string) => {
      console.log(`${newUser} connected`)
      if (newUser === username.value) return
      onlineUsers.value.push(newUser)
    })

    onMounted(async () => {
      const toast = await toastController.create({
        message: `Login successful, welcome.`,
        duration: 2000,
        color: 'success',
        position: 'top'
      })
      toast.present()
    })

    return { challenge, username, onlineUsers, loggedIn }
  }
}
</script>
<style scoped>
  .loggedIn {
    color: green; 
    margin-right: 10px;
  }
  ion-button {
    margin-top: 10px;
  }
  ion-label {
    font-family: Roboto;
    font-size: 1rem;
  }
  .challengeButton {
    font-family: Roboto;
    font-size: .8rem;
    right: 0;
  }
  .subLabel {
    font-size: 1.1rem;
    font-family: Roboto;
  }
</style>