<template>
  <div id="leaflet-map-container" style="height: 500px; width: 100%; border-radius: 8px;"></div>
  <div v-if="pending && !error" class="loading-overlay">
    <p>Memuat data outlet Kebab 95...</p>
  </div>
  <div v-if="error" class="error-overlay">
    <p>Gagal memuat data.<br>Pastikan server backend Anda di `localhost:3001` sudah berjalan.</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

// Definisikan variabel di scope luar agar bisa diakses di seluruh script setup
let map = null;
const outlets = ref([]);
const pending = ref(true);
const error = ref(null);

// Fungsi untuk mengambil data dari backend
async function fetchData() {
  try {
    pending.value = true;
    error.value = null;
    const response = await fetch('http://localhost:3001/api/outlets');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    outlets.value = await response.json();
  } catch (e) {
    error.value = e;
    console.error("Gagal mengambil data outlets:", e);
  } finally {
    pending.value = false;
  }
}

// Hook onMounted hanya berjalan di sisi client
onMounted(async () => {
  // Lakukan dynamic import untuk Leaflet dan CSS-nya DI DALAM onMounted
  // Ini memastikan kode Leaflet hanya dieksekusi di browser
  const L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');

  await fetchData(); // Panggil fetchData setelah Leaflet siap

  const mapElement = document.getElementById('leaflet-map-container');
  
  // Cek apakah mapElement ada dan map belum diinisialisasi
  if (mapElement && !map) { 
    map = L.map(mapElement).setView([-2.5489, 118.0149], 5); // Fokus awal di Indonesia

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Tampilkan marker jika data outlet berhasil diambil
    if (outlets.value && outlets.value.length > 0) {
      outlets.value.forEach(outlet => {
        if (outlet.latitude != null && outlet.longitude != null) { // Pastikan koordinat valid
          L.marker([outlet.latitude, outlet.longitude])
            .addTo(map)
            .bindPopup(`
              <div style="font-family: 'Poppins', sans-serif; font-size: 14px; max-width: 250px;">
                <h3 style="font-weight: 600; margin: 0 0 5px 0; color: #D97706;">${outlet.nama_outlet}</h3>
                <p style="margin: 0 0 8px 0; white-space: normal;">${outlet.alamat}</p>
                <hr style="margin: 8px 0; border: 0; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0;"><b>Telp:</b> ${outlet.telepon || '-'}</p>
                <p style="margin: 2px 0;"><b>Jam Buka:</b> ${outlet.jam_operasional || '-'}</p>
              </div>
            `);
        }
      });
    }
  }
});
</script>

<style scoped> /* `scoped` berarti style ini hanya berlaku untuk komponen ini */
.loading-overlay, .error-overlay {
  /* Styling untuk overlay, pastikan ini tidak mengganggu posisi map */
  /* Jika map-container punya position relative, ini akan relatif terhadapnya */
  /* Jika tidak, Anda mungkin perlu wrapper div di template dengan position: relative */
  position: absolute; 
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; /* Pastikan di atas peta jika peta belum dimuat */
  font-size: 1.2em;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-family: 'Poppins', sans-serif; /* Pastikan font Poppins jika belum global */
}

/* Styling untuk Dark Mode (jika Anda akan implementasikan di Astro) */
/* Ini memerlukan cara deteksi dark mode di level Astro atau prop dari parent */
/* .dark .loading-overlay, .dark .error-overlay { 
    background: rgba(31, 41, 55, 0.85); 
    color: #f3f4f6; 
} */

.error-overlay {
  color: #EF4444; /* red-500 */
}

/* CSS Leaflet sudah diimpor di script, jadi @import di sini tidak diperlukan lagi */
/* @import 'leaflet/dist/leaflet.css'; */
</style>