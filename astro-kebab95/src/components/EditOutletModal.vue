<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg m-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Edit Outlet</h3>
        <button @click="$emit('close')" class="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 dark:hover:text-gray-300">&times;</button>
      </div>

      <form @submit.prevent="handleUpdate" class="space-y-4">
        <div>
          <label for="edit-nama_outlet" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Outlet</label>
          <input type="text" id="edit-nama_outlet" v-model="editableOutlet.nama_outlet" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="edit-alamat" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Alamat</label>
          <textarea id="edit-alamat" v-model="editableOutlet.alamat" rows="3" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"></textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="edit-lat" class="block text-sm font-medium">Latitude</label>
              <input type="number" step="any" id="edit-lat" v-model="editableOutlet.latitude" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
            </div>
            <div>
              <label for="edit-lng" class="block text-sm font-medium">Longitude</label>
              <input type="number" step="any" id="edit-lng" v-model="editableOutlet.longitude" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="edit-telepon" class="block text-sm font-medium">Nomor Telepon</label>
              <input type="text" id="edit-telepon" v-model="editableOutlet.telepon" class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
            </div>
            <div>
              <label for="edit-jam_operasional" class="block text-sm font-medium">Jam Operasional</label>
              <input type="text" id="edit-jam_operasional" v-model="editableOutlet.jam_operasional" class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
            </div>
        </div>
        
        <div class="pt-4 flex justify-end space-x-3">
          <button type="button" @click="$emit('close')" class="rounded-md border border-gray-300 bg-white dark:bg-slate-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600">Batal</button>
          <button type="submit" :disabled="isLoading" class="rounded-md border border-transparent bg-yellow-500 py-2 px-4 text-sm font-medium text-white hover:bg-yellow-600 disabled:bg-gray-400">
            <span v-if="isLoading">Menyimpan...</span>
            <span v-else>Simpan Perubahan</span>
          </button>
        </div>
         <p v-if="statusMessage" :class="isError ? 'text-red-500' : 'text-green-500'" class="mt-3 text-sm">{{ statusMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  outlet: { type: Object, required: true }
});

const emit = defineEmits(['close', 'data-updated']);

const editableOutlet = reactive({});
const isLoading = ref(false);
const statusMessage = ref('');
const isError = ref(false);

// Salin props ke state lokal saat komponen pertama kali dibuat atau saat prop berubah
watch(() => props.outlet, (newVal) => {
  if (newVal) {
    Object.assign(editableOutlet, newVal);
  }
}, { immediate: true });

async function handleUpdate() {
  isLoading.value = true;
  statusMessage.value = '';
  isError.value = false;
  const token = localStorage.getItem('authToken');
  if (!token) {
    statusMessage.value = 'Error: Tidak terautentikasi.';
    isError.value = true;
    isLoading.value = false;
    return;
  }
  try {
    const response = await fetch(`http://localhost:3001/api/outlets/${editableOutlet.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(editableOutlet)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Gagal mengupdate outlet.');
    statusMessage.value = 'Sukses! Data outlet berhasil diupdate.';
    isError.value = false;
    emit('data-updated');
    setTimeout(() => { emit('close'); }, 1500);
  } catch (error) {
    statusMessage.value = error.message;
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
}
</script>