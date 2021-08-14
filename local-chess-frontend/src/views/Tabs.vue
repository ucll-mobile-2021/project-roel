<template>

  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="users" href="/tabs/users">
          <ion-icon :icon="search"/>
          <ion-label class="tabsLabel">Find an opponent</ion-label>
        </ion-tab-button>
          
        <ion-tab-button tab="tab2" href="/tabs/chessboard">
          <ion-icon :icon="gameController" />
          <ion-label class="tabsLabel">Chessboard</ion-label>
        </ion-tab-button>
        
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet} from '@ionic/vue';
import { gameController, search } from 'ionicons/icons';

export default {
  name: 'Tabs',
  components: { IonLabel, IonTabs, IonTabBar, IonTabButton, IonIcon, IonPage, IonRouterOutlet },
  setup() {
    return {
      gameController,
      search,
    }
  }
}
</script>
<style scoped>

  .ion-md-search::selected {
    color: black !important;
  }
  ion-tab-button {
    --background-focused: rgb(12, 11, 12);
    --color-selected: #f0e10f;
  }
  .tabsLabel {
    font-family: Roboto;
    font-size: 1rem;
  }
</style>