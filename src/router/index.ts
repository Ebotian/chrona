import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/article/:slug', name: 'article-detail', component: Home, props: true }
  ]
})

export default router
