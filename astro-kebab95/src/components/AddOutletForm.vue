<template>
  <div class="space-y-6">
    <div>
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Lokasi di Peta</label>
      <div id="mini-map" class="mt-1 h-80 w-full rounded-md border border-slate-300 dark:border-slate-600"></div>
      <p class="mt-1 text-xs text-slate-500">Klik pada peta untuk menentukan Latitude & Longitude.</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="lat" class="block text-sm font-medium">Latitude</label>
          <input type="text" id="lat" v-model="form.latitude" readonly class="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="lng" class="block text-sm font-medium">Longitude</label>
          <input type="text" id="lng" v-model="form.longitude" readonly class="mt-1 block w-full rounded-md border-slate-300 bg-slate-100 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
      </div>

      <div>
        <label for="nama_outlet" class="block text-sm font-medium">Nama Outlet</label>
        <input type="text" id="nama_outlet" v-model="form.nama_outlet" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
      </div>

      <div>
        <label for="alamat" class="block text-sm font-medium">Alamat</label>
        <textarea id="alamat" v-model="form.alamat" rows="3" required class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="telepon" class="block text-sm font-medium">Nomor Telepon</label>
          <input type="text" id="telepon" v-model="form.telepon" class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="jam_operasional" class="block text-sm font-medium">Jam Operasional</label>
          <input type="text" id="jam_operasional" v-model="form.jam_operasional" placeholder="Contoh: 10:00 - 22:00" class="mt-1 block w-full rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm">
        </div>
      </div>

      <div class="pt-4">
         <button type="submit" :disabled="isLoading" class="inline-flex justify-center rounded-md border border-transparent bg-yellow-500 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-slate-400 dark:focus:ring-offset-slate-900">
            <span v-if="isLoading">Menyimpan...</span>
            <span v-else>Tambah Outlet</span>
        </button>
        <p v-if="statusMessage" :class="isError ? 'text-red-500' : 'text-green-500'" class="mt-3 text-sm">{{ statusMessage }}</p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';

let map;
let marker;
let L;

// Gunakan 'reactive' untuk mengelompokkan data form
const form = reactive({
    nama_outlet: '',
    alamat: '',
    latitude: null,
    longitude: null,
    jam_operasional: '',
    telepon: ''
});

const isLoading = ref(false);
const statusMessage = ref('');
const isError = ref(false);

onMounted(async () => {
    // Impor Leaflet secara dinamis hanya di client
    L = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    const mapElement = document.getElementById('mini-map');
    if (mapElement && !map) {
        map = L.map('mini-map').setView([-2.5489, 118.0149], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Menambahkan event listener saat peta di-klik
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            form.latitude = lat.toFixed(6);
            form.longitude = lng.toFixed(6);

            // Buat atau pindahkan marker ke lokasi klik
            if (!marker) {
                marker = L.marker(e.latlng).addTo(map);
            } else {
                marker.setLatLng(e.latlng);
            }
        });
    }
});

// Fungsi untuk handle submit form
async function handleSubmit() {
    isLoading.value = true;
    statusMessage.value = '';
    isError.value = false;

    // Ambil token dari localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
        statusMessage.value = 'Error: Anda tidak terautentikasi. Silakan login kembali.';
        isError.value = true;
        isLoading.value = false;
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/outlets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Sertakan token di header
            },
            body: JSON.stringify(form)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Gagal menambahkan outlet.');
        }

        statusMessage.value = 'Sukses! Outlet baru berhasil ditambahkan.';
        isError.value = false;
        // Kosongkan form setelah sukses
        Object.assign(form, { nama_outlet: '', alamat: '', latitude: null, longitude: null, jam_operasional: '', telepon: '' });
        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }

    } catch (error) {
        statusMessage.value = error.message;
        isError.value = true;
    } finally {
        isLoading.value = false;
    }
}
</script>