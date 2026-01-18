import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Tasks from '../views/Tasks.vue';
import TaskNew from '../views/TaskNew.vue';
import TaskEdit from '../views/TaskEdit.vue';

const routes = [
    { path: '/', redirect: '/tasks' },
    { path: '/login', component: Login },
    { path: '/tasks', component: Tasks, meta: { requiresAuth: true } },
    { path: '/tasks/new', component: TaskNew, meta: { requiresAuth: true } },
    {
        path: '/tasks/:id/edit',
        component: TaskEdit,
        meta: { requiresAuth: true },
    },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if ((to.meta as any).requiresAuth && !token) return next('/login');
    next();
});

export default router;
