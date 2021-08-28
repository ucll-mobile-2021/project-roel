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
      <div v-if="onlineUsers.length === 0">
        <ion-item style="font-size: .9rem;">No other users online.</ion-item>
      </div>
      <ion-grid id="userList" v-else v-for="user in onlineUsers" :key="user.name">
        <ion-row class="ion-align-items-center ion-justify-content-center">
          <ion-col size="4" class="ion-align-items-center ion-justify-content-center">
            <div>
              <span class="loggedIn">●</span>{{ user.name }}
            </div>
          </ion-col>
          <ion-col size="4" class="ion-align-items-center ion-justify-content-center">
            {{user.city}}, {{formatDistance(user.distance)}}
          </ion-col>
          <ion-col size="4" class="ion-align-items-center ion-justify-content-center">
            <ion-button class="challengeButton" color="button" :disabled="!loggedIn" @click="challenge(user.name)">Challenge</ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonLabel, IonItem, IonButton, IonListHeader, toastController, alertController } from '@ionic/vue';
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { useSocketStore } from '../stores/socket'

export default  {
  name: 'Users',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage, IonLabel, IonItem, IonButton, IonListHeader, IonGrid},
  setup() {
    type User = {
      name: string;
      city: string;
      distance: number;
      longitude: number;
      latitude: number;
    };
    const socketStore = useSocketStore()

    const router = useRouter()
    
    const onlineUsers = ref<Array<User>>([])
    const username = ref<string>(socketStore.username)
    const loggedIn = ref<boolean>(socketStore.loggedIn)

    socketStore.socket.emit('get-online-users')

    const formatDistance = (distance) => {
      const res = Math.round(distance)
      if (res >= 1000) return `${Math.round(res/1000)}km`
      return `${res}m`
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180; // φ, λ in radians
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const d = R * c; // in metres 
      
      const res = isNaN(d) || d < 1 ? 0 : d
      console.log(`Distance from eachother: ${res} meters. (d = ${d}`)
      return res
    }

    const challenge = (username) => {
      socketStore.socket.emit('challenge', username)
    }

    socketStore.socket.on('update-user', (user: User) => {
      if(user.name === username.value) return
      console.log("update-user got called")
      console.log(user)
      onlineUsers.value = onlineUsers.value.map((onlineUser) => {
        if(onlineUser.name === user.name) return user
        return onlineUser
      })
    })

    socketStore.socket.on('challenge-received', async (username: string) => {
      console.log(`Challenge received from ${username}`)
      if(socketStore.gameInProgress) {
        socketStore.socket.emit('challenge-denied', username)
        return
      }
      const alert = await alertController.create({
        header: 'Challenge received',
        message: 'Challenge received from ' + username + ', you will be white.',
        buttons: [
          {
            text: 'Accept',
            handler: accept => {
              console.log('accepted')
              socketStore.gameInProgress = true
              socketStore.opponent = username
              socketStore.color = 'white'
              socketStore.socket.emit('challenge-accepted', username)
              router.push('/tabs/chessboard')
            }
          },
          {
            text: 'Deny',
            role: 'cancel',
            handler: deny => {
              socketStore.socket.emit('challenge-denied', username)
            }
          }
        ]
      })
      alert.present()
    })

    socketStore.socket.on('challenge-accepted', (username) => {
      socketStore.gameInProgress = true
      socketStore.opponent = username
      socketStore.color = 'black'
      router.push('/tabs/chessboard')
    })

    socketStore.socket.on('online-users', users => {
      onlineUsers.value = users.filter((user) => user.name !== username.value).map((user) => {
        return {...user, distance: calculateDistance(socketStore.latitude, socketStore.longitude, user.latitude, user.longitude)}
      })
    })

    socketStore.socket.on('challenge-denied', async () => {
      socketStore.opponent = ''
      socketStore.gameInProgress = false
      socketStore.color = 'black'
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
    
    socketStore.socket.on('user-disconnect', (oldUser: string) => {
      if (socketStore.opponent === oldUser) { 
        socketStore.opponent = '' 
        socketStore.gameInProgress = false
      }
      onlineUsers.value = onlineUsers.value.filter((user) => user.name !== oldUser)
    })

    socketStore.socket.on('user-connect', (newUser: User) => {
      console.log(`${newUser} connected`)
      if (newUser.name === username.value) return
      onlineUsers.value.push({...newUser, distance: calculateDistance(socketStore.latitude, socketStore.longitude, newUser.latitude, newUser.longitude)})
    })

    onMounted(async () => {
      const toast = await toastController.create({
        message: `Login successful, welcome.`,
        duration: 2000,
        color: 'success',
        position: 'top'
      })
      toast.present()
      //await addGeolocation()
    })


    return { challenge, username, onlineUsers, loggedIn, formatDistance }
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
  ion-grid:nth-child(even) {
    background: #1e1e1e !important; 
  }
  ion-label {
    font-family: Roboto;
    font-size: 1rem;
  }
  .challengeButton {
    font-size: .8rem;
    font-weight: 500;
    font-family: Roboto;
    right: 0;
  }
  .subLabel {
    font-size: 1.1rem;
    font-family: Roboto;
  }
</style>