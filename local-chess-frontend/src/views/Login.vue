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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Geolocation } from '@capacitor/geolocation'
import axios from 'axios';

export default  {
  name: 'Login',
  components: { IonContent, IonPage, IonInput, IonButton, IonGrid, IonRow, IonCol, IonImg, IonTitle },
  setup() {
    type CityData = {
      city: string;
      latitude: number;
      longitude: number;
    }
    const socketStore = useSocketStore()
    const router = useRouter()

    const username = ref<string>('')
    const logo = 'assets/king.png'
    const cityData = ref<CityData>()



    const addGeolocation = async () => {
      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true
        })

        console.log(coordinates)

      const params = {
        //@ts-ignore
        auth: process.env.VUE_APP_GEOCODE,
        locate: `${coordinates.coords.latitude},${coordinates.coords.longitude}`,
        json: '1'
      }

        const cityData = await axios.get('https://geocode.xyz', {params})
        socketStore.latitude = coordinates.coords.latitude
        socketStore.longitude = coordinates.coords.longitude
        return {city: cityData.data.city, latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude};
        //socketStore.socket.emit('update-location', {city: cityData.data.city, latitude: coordinates.coords.latitude, longitude: coordinates.coords.longitude})
      } catch (error) {
        console.error('Error', error)
      }
    }

    const join = async () => {
      if(cityData.value === undefined) {
        const alert = await alertController.create({
        header: 'Geolocation',
        message: 'Wait for the app to find your geolocation before joining.',
        buttons: [
          {
            text: 'Ok',
          }
        ]
      })
      alert.present()
      return
      }
      //const cityData = await addGeolocation();
      socketStore.socket.emit('join', {name: username.value, ...cityData.value})
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


    onMounted(async () => {
      cityData.value = await addGeolocation();
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