<template>
  </template>

<script setup>
import { onMounted } from 'vue';
import { jwtDecode } from 'jwt-decode';

function runGlobalScripts() {
    const eventBus = {
        dispatch(event, data) { document.dispatchEvent(new CustomEvent(event, { detail: data })); }
    };

    // --- 1. LOGIKA DARK/LIGHT MODE ---
    const themeIconLight = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`;
    const themeIconDark = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.697-2.657z" /></svg>`;
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeToggleIconEl = document.getElementById('theme-toggle-icon');
    const themeToggleTextEl = document.getElementById('theme-toggle-text');
    const localStorageKey = 'kebab95-astro-theme';
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
    function toggleTheme() {
        const newTheme = htmlEl.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem(localStorageKey, newTheme);
        applyTheme(newTheme);
    }
    let currentTheme = localStorage.getItem(localStorageKey) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(currentTheme);
    if (themeToggleBtn && !themeToggleBtn.dataset.listenerAttached) {
        themeToggleBtn.addEventListener('click', toggleTheme);
        themeToggleBtn.dataset.listenerAttached = 'true';
    }

    // --- 2. LOGIKA TOMBOL LAYER PETA TOGGLE ---
    const mapLayerToggleBtn = document.getElementById('map-layer-toggle-btn');
    const mapLayerToggleIconEl = document.getElementById('map-layer-toggle-icon');
    const mapLayerToggleTextEl = document.getElementById('map-layer-toggle-text');
    let currentMapLayer = 'openstreetmap'; // Default layer
    const mapLayerIconStandard = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>`;
    const mapLayerIconSatellite = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A11.978 11.978 0 0112 16.5c-2.998 0-5.74-1.1-7.843-2.918m15.686-4.832A8.959 8.959 0 0021 12a8.958 8.958 0 01-2.582 5.918" /></svg>`;
    function applyMapLayerStyle(layerType) {
        if (layerType === 'satellite') {
            if(mapLayerToggleIconEl) mapLayerToggleIconEl.innerHTML = mapLayerIconStandard;
            if(mapLayerToggleTextEl) mapLayerToggleTextEl.textContent = 'Ganti Peta Standar';
        } else {
            if(mapLayerToggleIconEl) mapLayerToggleIconEl.innerHTML = mapLayerIconSatellite;
            if(mapLayerToggleTextEl) mapLayerToggleTextEl.textContent = 'Ganti ke Mode Satelit';
        }
    }
    function toggleMapLayer() {
        const newLayer = currentMapLayer === 'openstreetmap' ? 'satellite' : 'openstreetmap';
        currentMapLayer = newLayer;
        eventBus.dispatch('changeMapLayer', newLayer);
        applyMapLayerStyle(newLayer);
    }
    if (mapLayerToggleBtn && !mapLayerToggleBtn.dataset.listenerAttached) {
        applyMapLayerStyle(currentMapLayer);
        mapLayerToggleBtn.addEventListener('click', toggleMapLayer);
        mapLayerToggleBtn.dataset.listenerAttached = 'true';
    }

    // --- 3. LOGIKA SESI PENGGUNA ---
    const token = localStorage.getItem('authToken');
    const userInfoDiv = document.getElementById('user-info');
    const guestInfoDiv = document.getElementById('guest-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const adminAddOutletBtn = document.getElementById('admin-add-outlet-btn');
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            if (userInfoDiv) userInfoDiv.classList.remove('hidden');
            if (guestInfoDiv) guestInfoDiv.classList.add('hidden');
            if (usernameDisplay) usernameDisplay.textContent = decodedToken.username;
            if (decodedToken.role === 'admin' && adminAddOutletBtn) {
                adminAddOutletBtn.classList.remove('hidden');
            }
            if (logoutBtn && !logoutBtn.dataset.listenerAttached) {
                logoutBtn.addEventListener('click', () => { localStorage.removeItem('authToken'); window.location.reload(); });
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
}
onMounted(() => {
    runGlobalScripts();
    document.addEventListener('astro:page-load', runGlobalScripts);
});
</script>