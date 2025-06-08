<template>
  <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
    <div class="rounded-md shadow-sm -space-y-px">
      <div>
        <label for="username" class="sr-only">Username</label>
        <input 
          id="username" 
          name="username" 
          type="text" 
          v-model="username"
          required 
          class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder="Username"
        >
      </div>
      <div>
        <label for="password" class="sr-only">Password</label>
        <input 
          id="password" 
          name="password" 
          type="password"
          v-model="password" 
          required 
          class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
          placeholder="Password"
        >
      </div>
    </div>

    <div>
      <button 
        type="submit" 
        :disabled="isLoading"
        class="group relative flex w-full justify-center rounded-md border border-transparent bg-yellow-500 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400"
      >
        <span v-if="isLoading">Memproses...</span>
        <span v-else>Login</span>
      </button>
    </div>

    <div v-if="errorMessage" class="rounded-md bg-red-50 p-4 mt-4">
        <p class="text-sm font-medium text-red-800">{{ errorMessage }}</p>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';

// Variabel reaktif untuk menyimpan input form dan status
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

// Fungsi yang dipanggil saat form disubmit
async function handleLogin() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Jika respons tidak sukses (status 4xx atau 5xx), lempar error dengan pesan dari backend
      throw new Error(data.message || 'Terjadi kesalahan saat login.');
    }

    // Jika login berhasil:
    console.log('Login berhasil! Token:', data.token);
    // 1. Simpan token ke localStorage browser
    localStorage.setItem('authToken', data.token);

    // 2. Redirect ke halaman utama (peta)
    window.location.href = '/';

  } catch (error) {
    // Tangkap error dan tampilkan di UI
    errorMessage.value = error.message;
    console.error('Login failed:', error);
  } finally {
    // Apapun hasilnya, set isLoading kembali ke false
    isLoading.value = false;
  }
}
</script>