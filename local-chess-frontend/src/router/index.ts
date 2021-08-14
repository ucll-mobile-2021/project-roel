import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Tabs from '../views/Tabs.vue'
import { useSocketStore } from '@/stores/socket';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/tabs/',
    component: Tabs,
    children: [
      {
        path: '',
        redirect: '/'
      },
      {
        path: 'users',
        component: () => import('@/views/Users.vue')
      },
      {
        path: 'chessboard',
        component: () => import('@/views/Chessboard.vue'),
        
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const socketStore = useSocketStore()
  if(to.name !== 'Login' && !(socketStore.loggedIn)) next({path: '/'})
  else next()
})

export default router
