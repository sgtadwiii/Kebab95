<template>
  </template>

<script setup>
import { onMounted } from 'vue';
// --- PERBAIKAN UTAMA: Impor jwt-decode dari paket NPM ---
import { jwtDecode } from 'jwt-decode'; 

function runGlobalScripts() {
    // 1. EVENT BUS LOKAL
    const eventBus = {
        dispatch(event, data) { document.dispatchEvent(new CustomEvent(event, { detail: data })); }
    };

    // 2. LOGIKA DARK/LIGHT MODE
    const themeIconLight = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0L12 12m0 0l-3.657 3.657M12 12L8.343 8.343" /></svg>`;
    const themeIconDark = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleIconEl = document.getElementById('theme-toggle-icon');
    const themeToggleTextEl = document.getElementById('theme-toggle-text');
    
    function applyTheme(theme) {
        if (theme === 'dark') {
            htmlEl.classList.add('dark');
            if(themeToggleIconEl) themeToggleIconEl.innerHTML = themeIconDark;
            if(themeToggleTextEl) themeToggleTextEl.textContent = 'Ganti ke Terang';
        } else {
            htmlEl.classList.remove('dark');
            if(themeToggleIconEl) themeToggleIconEl.innerHTML = themeIconLight;
            if(themeToggleTextEl) themeToggleTextEl.textContent = 'Ganti ke Gelap';
        }
    }
    
    if (themeToggleBtn && !themeToggleBtn.dataset.listenerAttached) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = htmlEl.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('kebab95-theme', newTheme);
            applyTheme(newTheme);
        });
        themeToggleBtn.dataset.listenerAttached = 'true';
    }
    applyTheme(localStorage.getItem('kebab95-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    // 3. LOGIKA TOMBOL LAYER PETA TOGGLE
    const mapLayerToggleBtn = document.getElementById('map-layer-toggle-btn');
    const mapLayerToggleIconEl = document.getElementById('map-layer-toggle-icon');
    const mapLayerToggleTextEl = document.getElementById('map-layer-toggle-text');
    let currentMapLayer = 'openstreetmap'; 
    const mapIconStandard = `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.25c-.317-.159-.69-.159-1.006 0L4.875 5.688c-.317.159-.69.159-1.006 0L2.25 4.5" /></svg>`;
    const mapIconSatellite = `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-4.832A8.959 8.959 0 0021 12a8.958 8.958 0 01-2.582 5.918" /></svg>`;
    function applyMapLayerStyle(layerType) {
        if (layerType === 'satellite') {
            if(mapLayerToggleIconEl) mapLayerToggleIconEl.innerHTML = mapIconStandard;
            if(mapLayerToggleTextEl) mapLayerToggleTextEl.textContent = 'Peta Standar';
        } else {
            if(mapLayerToggleIconEl) mapLayerToggleIconEl.innerHTML = mapIconSatellite;
            if(mapLayerToggleTextEl) mapLayerToggleTextEl.textContent = 'Mode Satelit';
        }
    }
    if (mapLayerToggleBtn && !mapLayerToggleBtn.dataset.listenerAttached) {
        applyMapLayerStyle(currentMapLayer);
        mapLayerToggleBtn.addEventListener('click', () => {
            const newLayer = currentMapLayer === 'openstreetmap' ? 'satellite' : 'openstreetmap';
            currentMapLayer = newLayer;
            eventBus.dispatch('changeMapLayer', newLayer);
            applyMapLayerStyle(newLayer);
        });
        mapLayerToggleBtn.dataset.listenerAttached = 'true';
    }

    // 4. LOGIKA SESI PENGGUNA & PENJAGA HALAMAN
    const token = localStorage.getItem('authToken');
    const userInfoDiv = document.getElementById('user-info');
    const guestInfoDiv = document.getElementById('guest-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const adminAddOutletBtn = document.getElementById('admin-add-outlet-btn');
    let userRole = 'guest';

    if (token) {
        try {
            const decodedToken = jwtDecode(token); // Menggunakan jwtDecode yang diimpor dari NPM
            userRole = decodedToken.role;
            if (userInfoDiv) userInfoDiv.classList.remove('hidden');
            if (guestInfoDiv) guestInfoDiv.classList.add('hidden');
            if (usernameDisplay) usernameDisplay.textContent = decodedToken.username;
            if (userRole === 'admin' && adminAddOutletBtn) {
                adminAddOutletBtn.classList.remove('hidden');
            }
            if (logoutBtn && !logoutBtn.dataset.listenerAttached) {
                logoutBtn.addEventListener('click', () => { localStorage.removeItem('authToken'); window.location.href = '/'; });
                logoutBtn.dataset.listenerAttached = 'true';
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            if (userInfoDiv) userInfoDiv.classList.add('hidden');
            if (guestInfoDiv) guestInfoDiv.classList.remove('hidden');
        }
    } else {
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        if (guestInfoDiv) guestInfoDiv.classList.remove('hidden');
    }
    
    // Logika penjaga halaman admin
    if (window.location.pathname.startsWith('/admin') && userRole !== 'admin') {
        window.location.href = '/login'; 
    }
}

onMounted(() => {
    runGlobalScripts();
    document.addEventListener('astro:page-load', runGlobalScripts);
});
</script>