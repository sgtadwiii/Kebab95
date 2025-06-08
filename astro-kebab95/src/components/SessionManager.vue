<template>
  </template>

<script setup>
import { onMounted } from 'vue';
import { jwtDecode } from 'jwt-decode';

function handleUserSession() {
    // Ambil elemen dari DOM
    const token = localStorage.getItem('authToken');
    const userInfoDiv = document.getElementById('user-info');
    const guestInfoDiv = document.getElementById('guest-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const adminAddOutletBtn = document.getElementById('admin-add-outlet-btn'); // Ambil tombol admin

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            
            // Tampilkan info user & sembunyikan info guest
            if (userInfoDiv) userInfoDiv.classList.remove('hidden');
            if (guestInfoDiv) guestInfoDiv.classList.add('hidden');
            if (usernameDisplay) usernameDisplay.textContent = decodedToken.username;

            // Logika untuk menampilkan tombol admin
            if (decodedToken.role === 'admin' && adminAddOutletBtn) {
                adminAddOutletBtn.classList.remove('hidden');
            }

            // Tambahkan event listener untuk tombol logout
            if (logoutBtn) {
                if (!logoutBtn.dataset.listenerAttached) {
                    logoutBtn.addEventListener('click', () => {
                        localStorage.removeItem('authToken');
                        window.location.reload(); 
                    });
                    logoutBtn.dataset.listenerAttached = 'true';
                }
            }
        } catch (error) {
            console.error("Token JWT rusak, logout dipaksa:", error);
            localStorage.removeItem('authToken');
            if (userInfoDiv) userInfoDiv.classList.add('hidden');
            if (guestInfoDiv) guestInfoDiv.classList.remove('hidden');
        }
    } else {
        // Jika tidak ada token, tampilkan info guest
        if (userInfoDiv) userInfoDiv.classList.add('hidden');
        if (guestInfoDiv) guestInfoDiv.classList.remove('hidden');
    }
}

onMounted(() => {
    handleUserSession();
});
</script>