<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title color="button">Chessboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <chess-board-implementation/>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import ChessBoardImplementation from '../components/ChessBoardImplementation.vue'

export default  {
  name: 'Chessboard',
  components: { IonHeader, IonToolbar, IonTitle, IonContent, IonPage, ChessBoardImplementation }
}
</script>