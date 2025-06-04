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
import { onMounted, onUnmounted, ref } from 'vue';
import eventBus from '../lib/eventBus';

let map = null;
const outlets = ref([]);
const pending = ref(true);
const error = ref(null);
let L = null; 

const tileLayers = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }
  },
  satellite: { 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' }
  }
};
let activeTileLayer = null;

async function fetchData() {
  try {
    pending.value = true;
    error.value = null;
    console.log('[Map.vue] Memulai fetchData...');
    const response = await fetch('http://localhost:3001/api/outlets');
    console.log('[Map.vue] Status respons fetch:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('[Map.vue] Data outlets diterima:', JSON.parse(JSON.stringify(data))); // Log data
    outlets.value = data;
  } catch (e) {
    error.value = e;
    console.error("[Map.vue] Error saat fetchData:", e);
  } finally {
    pending.value = false;
  }
}

function switchTileLayer(type) {
  if (!map || !L || !tileLayers[type]) return; 
  if (activeTileLayer) map.removeLayer(activeTileLayer);
  activeTileLayer = L.tileLayer(tileLayers[type].url, tileLayers[type].options);
  activeTileLayer.addTo(map);
}

onMounted(async () => {
  console.log('[Map.vue] Komponen onMounted dimulai.');
  // Karena onMounted HANYA berjalan di client, kita tidak perlu 'if (process.client)' di sini
  
  L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');
  console.log('[Map.vue] Leaflet berhasil diimpor.');

  await fetchData();
  console.log('[Map.vue] Selesai fetchData. Isi outlets.value:', JSON.parse(JSON.stringify(outlets.value)));

  const mapElement = document.getElementById('leaflet-map-container');
  
  if (mapElement && !map) { 
    map = L.map(mapElement).setView([-2.5489, 118.0149], 5);
    console.log('[Map.vue] Peta berhasil diinisialisasi.');
    
    switchTileLayer('openstreetmap'); 

    if (outlets.value && outlets.value.length > 0) {
      console.log(`[Map.vue] Menambahkan ${outlets.value.length} marker ke peta.`);
      outlets.value.forEach(outlet => {
        if (outlet.latitude != null && outlet.longitude != null) {
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
    } else {
      console.log('[Map.vue] Tidak ada data outlet untuk ditampilkan sebagai marker.');
    }
    eventBus.on('changeMapLayer', switchTileLayer);
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') { // Pastikan hanya berjalan di client
    eventBus.remove('changeMapLayer', switchTileLayer);
  }
});
</script>

<style scoped> 
@import 'leaflet/dist/leaflet.css';

.loading-overlay, .error-overlay {
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
  z-index: 10;
  font-size: 1.2em;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-family: 'Poppins', sans-serif;
}

.dark .loading-overlay, .dark .error-overlay { 
    background: rgba(31, 41, 55, 0.85); 
    color: #f3f4f6; 
}

.error-overlay {
  color: #EF4444;
}
</style>