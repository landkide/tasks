<template>
    <div class="container">
        <h2>タスク編集</h2>
        <form v-if="loaded" @submit.prevent="submit">
            <div>
                <label>タイトル</label>
                <input v-model="form.title" required />
            </div>
            <div>
                <label>説明</label>
                <textarea v-model="form.description"></textarea>
            </div>
            <div>
                <label>期限</label>
                <input type="date" v-model="form.due_date" />
            </div>
            <div>
                <label>優先度</label>
                <select v-model="form.priority">
                    <option>高</option>
                    <option>中</option>
                    <option>低</option>
                </select>
            </div>
            <div>
                <label>ステータス</label>
                <select v-model="form.status">
                    <option>未着手</option>
                    <option>進行中</option>
                    <option>完了</option>
                </select>
            </div>
            <div>
                <label>担当者</label>
                <select v-model.number="form.assignee_id">
                    <option :value="null">-- 未設定 --</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">
                        {{ u.name }} ({{ u.userid }})
                    </option>
                </select>
            </div>
            <div>
                <label>tags (comma separated)</label>
                <input v-model="tagsInput" placeholder="tag1, tag2" />
            </div>
            <div>
                <button type="submit">保存</button>
                <button type="button" @click="cancel">キャンセル</button>
            </div>
        </form>
        <div v-else>読み込み中...</div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import api from '../services/api';
import { useRouter, useRoute } from 'vue-router';

export default defineComponent({
    setup() {
        const router = useRouter();
        const route = useRoute();
        const id = route.params.id as string;
        const loaded = ref(false);
        const form = ref<any>({});
        const tagsInput = ref('');
        const users = ref<any[]>([]);

        async function load() {
            const res = await api.get(`/tasks/${id}`);
            const t = res.data.task;
            form.value = { ...t };
            tagsInput.value = (t.tags || []).join(', ');
            try {
                const usersRes = await api.get('/users');
                users.value = usersRes.data.users || [];
            } catch (e) {
                users.value = [];
            }
            loaded.value = true;
        }

        async function submit() {
            const payload = {
                ...form.value,
                tags: tagsInput.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            };
            await api.put(`/tasks/${id}`, payload);
            router.push('/tasks');
        }

        function cancel() {
            router.push('/tasks');
        }

        onMounted(() => {
            load().catch(() => {
                router.push('/tasks');
            });
        });
        return { loaded, form, tagsInput, submit, cancel };
    },
});
</script>

<style scoped>
.container {
    max-width: 720px;
    margin: 24px;
}
</style>
