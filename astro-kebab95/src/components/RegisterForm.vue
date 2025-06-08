<template>
  <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
    <div class="rounded-md shadow-sm -space-y-px">
      <div>
        <label for="username" class="sr-only">Username</label>
        <input id="username" name="username" type="text" v-model="form.username" required class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Username">
      </div>
      <div>
        <label for="password" class="sr-only">Password</label>
        <input id="password" name="password" type="password" v-model="form.password" required class="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Password">
      </div>
      <div>
        <label for="confirm-password" class="sr-only">Konfirmasi Password</label>
        <input id="confirm-password" name="confirm-password" type="password" v-model="form.confirmPassword" required class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Konfirmasi Password">
      </div>
    </div>

    <div>
      <button type="submit" :disabled="isLoading" class="group relative flex w-full justify-center rounded-md border border-transparent bg-yellow-500 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400">
        <span v-if="isLoading">Mendaftarkan...</span>
        <span v-else>Daftar</span>
      </button>
    </div>

    <div v-if="statusMessage" :class="isError ? 'text-red-500' : 'text-green-500'" class="mt-3 text-sm text-center">
        <p>{{ statusMessage }}</p>
        <a v-if="!isError" href="/login" class="font-medium text-yellow-600 hover:text-yellow-500">Klik di sini untuk login</a>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({
    username: '',
    password: '',
    confirmPassword: ''
});
const isLoading = ref(false);
const statusMessage = ref('');
const isError = ref(false);

async function handleRegister() {
    if (form.password !== form.confirmPassword) {
        statusMessage.value = 'Password dan konfirmasi password tidak cocok.';
        isError.value = true;
        return;
    }

    isLoading.value = true;
    statusMessage.value = '';
    isError.value = false;

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: form.username,
                password: form.password
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Gagal mendaftarkan akun.');
        }
        statusMessage.value = 'Registrasi berhasil! Anda sekarang bisa login.';
        isError.value = false;
    } catch (error) {
        statusMessage.value = error.message;
        isError.value = true;
    } finally {
        isLoading.value = false;
    }
}
</script>