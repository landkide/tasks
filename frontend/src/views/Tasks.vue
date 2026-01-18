<template>
    <div class="tasks-board container">
        <header class="board-header">
            <div class="header-left">
                <h2>タスク</h2>
                <p class="sub">Trello / Notion風のカードビュー</p>
            </div>
            <div class="header-actions">
                <button class="btn ghost" @click="$router.push('/tasks/new')">
                    ＋ タスクを追加
                </button>
                <button class="btn muted" @click="logout">ログアウト</button>
            </div>
        </header>

        <div v-if="tasks.length === 0" class="empty">
            まだタスクがありません。新しいタスクを作成してください。
        </div>

        <main class="board-content">
            <div class="columns">
                <div class="column">
                    <h3 class="col-title">すべてのタスク</h3>
                    <div class="column-body">
                        <div v-for="t in tasks" :key="t.id" class="card">
                            <div class="card-top">
                                <div class="card-title">{{ t.title }}</div>
                                <div class="chip-group">
                                    <span
                                        class="chip status"
                                        :data-status="t.status"
                                        >{{ t.status }}</span
                                    >
                                </div>
                            </div>

                            <div class="card-content">
                                <p class="desc" v-if="t.description">
                                    {{ t.description }}
                                </p>
                                <div class="meta-row">
                                    <span class="meta-item"
                                        >担当:
                                        <strong>{{
                                            t.assignee?.name || '-'
                                        }}</strong></span
                                    >
                                    <span class="meta-item"
                                        >優先: {{ t.priority || '-' }}</span
                                    >
                                    <span class="meta-item"
                                        >期限: {{ t.due_date || '-' }}</span
                                    >
                                </div>
                                <div
                                    class="tags"
                                    v-if="t.tags && t.tags.length"
                                >
                                    <span
                                        v-for="(tag, idx) in t.tags"
                                        :key="idx"
                                        class="tag"
                                        :style="tagStyle(tag)"
                                        >{{ tag }}</span
                                    >
                                </div>
                            </div>

                            <div class="card-actions">
                                <button
                                    class="action small"
                                    @click="editTask(t.id)"
                                >
                                    編集
                                </button>
                                <button
                                    class="action small danger"
                                    @click="openDeleteModal(t.id)"
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- 削除確認モーダル -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
            <h4>
                本当に「{{
                    (deletedTask && deletedTask.title) || 'タスク'
                }}」を削除しますか？
            </h4>
            <p class="task-desc" v-if="deletedTask && deletedTask.description">
                {{ deletedTask.description }}
            </p>

            <div class="modal-tags" v-if="(deletedTask?.tags || []).length">
                <span
                    v-for="(tag, idx) in deletedTask?.tags || []"
                    :key="idx"
                    class="tag-badge"
                    >{{ tag }}</span
                >
            </div>

            <p class="muted">この操作は取り消せません。</p>
            <div class="modal-actions">
                <button class="btn" @click="closeModal">キャンセル</button>
                <button class="btn danger" @click="confirmDelete">
                    削除する
                </button>
            </div>
        </div>
    </div>

    <!-- トースト -->
    <div v-if="showToast" class="toast">
        <span class="toast-text">{{ toastMessage }}</span>
        <button class="toast-undo" @click="undoDelete">元に戻す</button>
    </div>
    <!-- Undo 成功トースト -->
    <div v-if="showSuccessToast" class="toast success">
        <span class="toast-text">{{ successMessage }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

export default defineComponent({
    setup() {
        const tasks = ref<any[]>([]);
        const router = useRouter();
        // modal / toast state
        const showConfirm = ref(false);
        const confirmId = ref<number | null>(null);
        const showToast = ref(false);
        const toastMessage = ref('');
        let toastTimer: any = null;
        // store last deleted task for undo
        const deletedTask = ref<any | null>(null);
        // success toast state for undo
        const showSuccessToast = ref(false);
        const successMessage = ref('');
        let successTimer: any = null;

        async function load() {
            const res = await api.get('/tasks');
            tasks.value = res.data.tasks;
        }

        function logout() {
            localStorage.removeItem('token');
            router.push('/login');
        }

        function statusStyle(status: string) {
            const map: any = {
                未着手: { color: '#777' },
                進行中: { color: '#0b69ff' },
                完了: { color: '#0a9f3a' },
            };
            return map[status] || {};
        }
        function editTask(id: number) {
            router.push(`/tasks/${id}/edit`);
        }

        async function openDeleteModal(id: number) {
            confirmId.value = id;
            // fetch task so we can show its title in modal before deletion
            try {
                const res = await api.get(`/tasks/${id}`);
                deletedTask.value = res.data.task;
            } catch (err) {
                deletedTask.value = null;
            }
            showConfirm.value = true;
        }

        // preset color map for tags (pastel backgrounds)
        const TAG_COLOR_MAP: Record<string, string> = {
            '重要': '#F9D5D3',
            '進行中': '#D6EAF8',
            '完了': '#D5F5E3',
            '情報': '#FCF3CF',
            // add more presets here if needed
        };
        const TAG_FALLBACK = '#F3F4F6'; // soft fallback

        function tagStyle(tag: string) {
            const bg = TAG_COLOR_MAP[tag] || TAG_FALLBACK;
            const textColor = '#0f172a'; // dark text for readability
            return { background: bg, color: textColor };
        }

        function closeModal() {
            showConfirm.value = false;
            confirmId.value = null;
        }

        async function deleteTask(id: number) {
            if (!confirm('本当に削除しますか？')) return;
            // before deleting, fetch the task to keep a copy for undo
            try {
                const getRes = await api.get(`/tasks/${id}`);
                deletedTask.value = getRes.data.task;
            } catch (err) {
                deletedTask.value = null;
            }
            await api.delete(`/tasks/${id}`);
            await load(); // 削除後に一覧を再読み込み
        }

        async function confirmDelete() {
            if (!confirmId.value) return;
            // reuse existing deleteTask logic to keep behavior consistent
            await deleteTask(confirmId.value);
            closeModal();
            // show toast with task name
            const name = deletedTask.value?.title || 'タスク';
            toastMessage.value = `${name} を削除しました`;
            showToast.value = true;
            if (toastTimer) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                showToast.value = false;
                toastMessage.value = '';
                // clear deletedTask after toast expires
                deletedTask.value = null;
            }, 3500);
        }

        async function undoDelete() {
            if (!deletedTask.value) return;
            const t = deletedTask.value;
            // prepare payload similar to TaskNew: map fields
            const payload: any = {
                title: t.title,
                description: t.description,
                due_date: t.due_date,
                priority: t.priority,
                status: t.status,
                assignee_id: t.assignee?.id || null,
                tags: t.tags || [],
            };
            try {
                await api.post('/tasks', payload);
                // reload tasks and hide delete-toast
                await load();
                showToast.value = false;
                toastMessage.value = '';
                // show success toast
                successMessage.value = `${t.title} を復元しました`;
                showSuccessToast.value = true;
                if (successTimer) clearTimeout(successTimer);
                successTimer = setTimeout(() => {
                    showSuccessToast.value = false;
                    successMessage.value = '';
                }, 2500);
                deletedTask.value = null;
                if (toastTimer) clearTimeout(toastTimer);
            } catch (err) {
                console.error('undo failed', err);
            }
        }
        onMounted(() => {
            load().catch((err) => {
                console.error(err);
                if (err.response?.status === 401) router.push('/login');
            });
        });
        return {
            tasks,
            logout,
            statusStyle,
            tagStyle,
            editTask,
            deleteTask,
            openDeleteModal,
            closeModal,
            confirmDelete,
            showConfirm,
            showToast,
            toastMessage,
            undoDelete,
            deletedTask,
            showSuccessToast,
            successMessage,
        };
    },
});
</script>

<style>
:root {
    --bg: #fbfbfc;
    --card: #ffffff;
    --muted: #6b7280;
    --accent: #7c3aed; /* soft purple */
    --danger: #ef4444;
    --soft-border: #eef2f6;
}
.tasks-board {
    padding: 28px;
    background: var(--bg);
    min-height: 100vh;
}
.board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}
.header-left h2 {
    margin: 0;
    font-size: 1.4rem;
}
.sub {
    margin: 0;
    color: var(--muted);
    font-size: 0.9rem;
}
.header-actions {
    display: flex;
    gap: 10px;
}
.btn {
    background: transparent;
    border-radius: 8px;
    padding: 8px 12px;
    border: 1px solid var(--soft-border);
    cursor: pointer;
    font-size: 0.95rem;
}
.btn.ghost {
    background: #fff;
}
.btn.muted {
    background: transparent;
    color: var(--muted);
}
.btn:hover {
    transform: translateY(-1px);
}
.empty {
    padding: 40px;
    text-align: center;
    color: var(--muted);
}
.board-content {
    display: flex;
    gap: 18px;
}
.columns {
    display: flex;
    gap: 18px;
    width: 100%;
}
.column {
    flex: 1;
}
.col-title {
    margin: 0 0 12px 0;
    color: var(--muted);
    font-weight: 600;
}
.column-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.card {
    background: var(--card);
    border-radius: 10px;
    padding: 14px;
    border: 1px solid var(--soft-border);
    box-shadow: 0 4px 10px rgba(16, 24, 40, 0.04);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.card:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);
}
.card-top {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 8px;
}
.card-title {
    font-weight: 600;
    color: #0f172a;
}
.chip-group {
    display: flex;
    gap: 6px;
}
.chip {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 0.85rem;
}
.chip.status {
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
}
.chip.status[data-status='進行中'] {
    background: #eef2ff;
    color: #0b69ff;
}
.chip.status[data-status='完了'] {
    background: #ecfdf5;
    color: #059669;
}
.chip.status[data-status='未着手'] {
    background: #f8fafc;
    color: #6b7280;
}
.card-content {
    margin-top: 10px;
}
.desc {
    color: #374151;
    margin: 0 0 10px 0;
}
.meta-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    color: var(--muted);
    font-size: 0.9rem;
}
.tags {
    margin-top: 8px;
}
.tag {
    display: inline-block;
    background: #fff7ed;
    color: #b45309;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 0.8rem;
    margin-right: 6px;
}
.card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
}
.action {
    background: transparent;
    border: 1px solid transparent;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    color: var(--muted);
}
.action.small {
    font-size: 0.9rem;
}
.action.danger {
    color: var(--danger);
    background: transparent;
}
.action:hover {
    background: #f8fafc;
}

@media (max-width: 900px) {
    .columns {
        flex-direction: column;
    }
}

/* modal + toast */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 80;
}
.modal {
    background: var(--card);
    padding: 18px;
    border-radius: 12px;
    width: 100%;
    max-width: 420px;
    border: 1px solid var(--soft-border);
    box-shadow: 0 12px 40px rgba(2, 6, 23, 0.12);
}
.modal h4 {
    margin: 0 0 6px 0;
}
.modal .muted {
    color: var(--muted);
    margin: 0 0 12px 0;
}
.modal .task-name {
    font-weight: 700;
    color: #0f172a;
    margin: 6px 0;
}
.modal-tags {
    display: flex;
    gap: 8px;
    margin: 10px 0;
}
.tag-badge {
    background: #f3f4f6;
    padding: 6px 8px;
    border-radius: 999px;
    font-size: 0.85rem;
    color: #374151;
}
.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
.toast {
    position: fixed;
    right: 18px;
    top: 18px;
    background: rgba(16, 24, 40, 0.95);
    color: #fff;
    padding: 10px 14px;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(2, 6, 23, 0.2);
    z-index: 90;
    transition: opacity 0.3s ease;
}
.toast .toast-text {
    margin-right: 10px;
}
.toast .toast-undo {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
}
</style>
