<template>
  <div class="mt-4">
    <div v-if="isLoading" class="text-center text-slate-500">
      Memuat daftar outlet...
    </div>
    <div v-else-if="error" class="text-center text-red-500">
      Gagal memuat data: {{ error }}
    </div>
    <div v-else-if="outlets.length === 0" class="text-center text-slate-500">
      Belum ada outlet yang ditambahkan.
    </div>
    <ul v-else class="space-y-3">
      <li v-for="outlet in outlets" :key="outlet.id" class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md shadow-sm">
        <div>
          <p class="font-semibold text-slate-800 dark:text-slate-100">{{ outlet.nama_outlet }}</p>
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ outlet.alamat }}</p>
        </div>
        <div class="flex space-x-2 flex-shrink-0">
          <button @click="openEditModal(outlet)" class="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Edit
          </button>
          <button @click="deleteOutlet(outlet.id)" class="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
            Hapus
          </button>
        </div>
      </li>
    </ul>
  </div>

  <EditOutletModal 
    v-if="isModalOpen" 
    :outlet="selectedOutlet"
    @close="isModalOpen = false"
    @data-updated="handleDataUpdate"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import EditOutletModal from './EditOutletModal.vue'; // Impor komponen modal

const outlets = ref([]);
const isLoading = ref(true);
const error = ref(null);

const isModalOpen = ref(false);
const selectedOutlet = ref(null);

function openEditModal(outlet) {
  selectedOutlet.value = { ...outlet }; // Kirim salinan data untuk diedit
  isModalOpen.value = true;
}

function handleDataUpdate() {
    isModalOpen.value = false;
    fetchOutlets(); // Ambil ulang data setelah update
}

async function fetchOutlets() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch('http://localhost:3001/api/outlets');
    if (!response.ok) throw new Error('Gagal mengambil data dari server.');
    outlets.value = await response.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

async function deleteOutlet(id) {
  if (!window.confirm(`Anda yakin ingin menghapus outlet dengan ID ${id}?`)) return;
  const token = localStorage.getItem('authToken');
  if (!token) { alert('Autentikasi gagal. Silakan login kembali.'); return; }
  try {
    const response = await fetch(`http://localhost:3001/api/outlets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Gagal menghapus outlet.');
    outlets.value = outlets.value.filter(o => o.id !== id);
    alert(data.message);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

onMounted(fetchOutlets);
</script>