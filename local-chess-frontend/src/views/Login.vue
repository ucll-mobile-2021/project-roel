<template>
  <ion-page id="login">
    <ion-content :fullscreen="true">
      <ion-grid>
        <ion-row id="titleRow" class="ion-align-items-center ion-justify-content-center">
          <ion-col class="ion-align-self-center ion-text-center">
            <div>
              <ion-img id="loginLogo" :src="logo"></ion-img>
              <ion-title id="loginTitle" color="button">local.chess</ion-title>
            </div>
          </ion-col>
        </ion-row>
        <ion-row id="inputRow" class="ion-align-items-center ion-justify-content-center">
          <ion-col class="ion-align-self-center ion-text-center">
            <ion-input id="usernameInput" color="button" placeholder="Enter your username" v-model="username"></ion-input>
            <ion-button color="button" id="loginButton" @click="join">Join</ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
      
      
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonContent, IonInput, IonButton, IonGrid, IonRow, IonCol, IonImg, IonTitle, alertController } from '@ionic/vue';
import { useSocketStore } from '../stores/socket'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default  {
  name: 'Login',
  components: { IonContent, IonPage, IonInput, IonButton, IonGrid, IonRow, IonCol, IonImg, IonTitle },
  setup() {
    const socketStore = useSocketStore()
    const router = useRouter()

    const username = ref<string>('')
    const logo = 'assets/king.png'


    const join = () => {
      socketStore.socket.emit('join', username.value)
    }

    socketStore.socket.on('login-success', (username) => {
      socketStore.username = username
      socketStore.loggedIn = true
      console.log(`Username after login: ${socketStore.username}`)
      router.push('/tabs/users')
    })

    socketStore.socket.on('logout-success', () => {
      socketStore.loggedIn = false
    })

    socketStore.socket.on('duplicate-username', async () => {
      username.value = ''
      socketStore.username = ''
      socketStore.loggedIn = false
      const alert = await alertController.create({header: 'Error', subHeader: 'Duplicate username', message: 'Sorry, this username is already in use!', buttons: ['OK'],})
      await alert.present()
    })

    return { username, join, logo }
  }
}
</script>
<style scoped>
  #usernameInput {
    font-family: Roboto;
    font-size: 1.5rem;
    border-bottom: 1px solid rgb(240, 225, 15);
    margin-bottom: 1rem;
  }

  #loginButton {
    font-size: 1.5rem;
    font-family: Roboto;
    color: rgb(240, 225, 15)
  }

  #loginLogo {
    width: 18%;
    max-width: 75px;
    height: auto;
    display: inline-block;
  }

  #loginTitle {
    display: inline-block;
    vertical-align: bottom;
    font-size: 2rem;
    font-family: Roboto;
    font-weight: 700;
  }

  #inputRow {
    margin-top: 3rem;
  }

  #titleRow {
    margin-top: 10rem;
  }

</style>