<template>
  <div class="container">
    <h1>Login</h1>
    <form @submit.prevent="submit">
      <div>
        <label>ユーザーID</label>
        <input v-model="userid" />
      </div>
      <div>
        <label>パスワード</label>
        <input type="password" v-model="password" />
      </div>
      <div>
        <button type="submit">ログイン</button>
      </div>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import api from '../services/api'
import { useRouter } from 'vue-router'

export default defineComponent({
  setup(){
    const userid = ref('')
    const password = ref('')
    const error = ref('')
    const router = useRouter()

    async function submit(){
      error.value = ''
      try{
        const res = await api.post('/auth/login', { userid: userid.value, password: password.value })
        localStorage.setItem('token', res.data.token)
        router.push('/tasks')
      }catch(e:any){
        error.value = e.response?.data?.error || 'Login failed'
      }
    }

    return { userid, password, error, submit }
  }
})
</script>

<style scoped>
.container{max-width:480px;margin:40px auto}
.error{color:red}
</style>
