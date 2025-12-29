# PWA (Progressive Web App) - Sistem Manajemen Kos

## Overview

Sistem Manajemen Kos sekarang mendukung Progressive Web App (PWA), yang memungkinkan aplikasi untuk:

- ✅ **Dapat di-install** di home screen (seperti aplikasi native)
- ✅ **Splash screen** saat loading
- ✅ **Standalone mode** (tanpa browser bar)
- ✅ **Auto-update** saat ada versi baru
- ✅ **Cache assets** untuk loading lebih cepat

## Cara Install PWA

### Desktop (Chrome/Edge)

1. Buka aplikasi di browser
2. Klik ikon **install** (⊕) di address bar
3. Atau klik menu (⋮) → "Install Sistem Manajemen Kos"

### Mobile (Android)

1. Buka aplikasi di Chrome
2. Tap banner "Add to Home screen" yang muncul
3. Atau tap menu (⋮) → "Add to Home screen"

### Mobile (iOS/Safari)

1. Buka aplikasi di Safari
2. Tap ikon Share (⬆️)
3. Scroll dan tap "Add to Home Screen"
4. Tap "Add"

## File PWA

```
frontend/
├── public/
│   ├── icons/               # PWA icons (72-512px)
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── favicon.svg
│   └── robots.txt
├── vite.config.js           # PWA configuration
└── index.html               # PWA meta tags
```

## Konfigurasi PWA

PWA dikonfigurasi di `vite.config.js` menggunakan `vite-plugin-pwa`:

```javascript
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Sistem Manajemen Kos',
    short_name: 'KosApp',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    display: 'standalone',
    // ... icons
  },
  workbox: {
    // Caching strategies
  }
})
```

## Manifest Properties

| Property | Value | Deskripsi |
|----------|-------|-----------|
| `name` | Sistem Manajemen Kos | Nama lengkap aplikasi |
| `short_name` | KosApp | Nama singkat (di home screen) |
| `theme_color` | #3b82f6 | Warna tema (blue-500) |
| `background_color` | #ffffff | Warna background splash |
| `display` | standalone | Mode tampilan (tanpa browser bar) |
| `orientation` | portrait | Orientasi default |
| `start_url` | / | URL awal saat dibuka |

## Caching Strategy

PWA menggunakan Workbox untuk caching dengan strategi berbeda untuk setiap jenis data:

### 1. Precaching (Install Time)
Semua assets statis di-cache saat install:
- JavaScript, CSS, HTML
- Images (PNG, SVG, WebP)
- Fonts (WOFF2)

### 2. Runtime Caching

| Endpoint | Strategy | TTL | Deskripsi |
|----------|----------|-----|-----------|
| `/api/kamar` | NetworkFirst | 24 jam | Data kamar |
| `/api/tagihan` | NetworkFirst | 1 jam | Data tagihan |
| `/api/laporan` | NetworkFirst | 1 jam | Data laporan |
| `/api/barang` | NetworkFirst | 24 jam | Data inventaris |
| `/api/users` | NetworkFirst | 1 jam | Data pengguna |
| `/api/auth/me` | NetworkFirst | 30 menit | User session |
| `/uploads/*` | CacheFirst | 30 hari | Uploaded images |
| Google Fonts | CacheFirst | 1 tahun | Typography |

### 3. Offline Fallback
- Navigasi ke halaman offline akan menampilkan cached `index.html`
- API requests akan menggunakan cached data jika offline

## Offline UI Components

### OfflineBanner
Banner kuning yang muncul di atas saat offline:
```jsx
import { OfflineBanner } from '@components/common/OfflineIndicator';
```

### PWAUpdatePrompt
Prompt untuk update saat ada versi baru:
```jsx
import { PWAUpdatePrompt } from '@components/common/OfflineIndicator';
```

### NetworkStatusBadge
Badge kecil yang menunjukkan status online/offline:
```jsx
import { NetworkStatusBadge } from '@components/common/OfflineIndicator';
```

## Background Sync

Aplikasi mendukung background sync untuk request yang gagal saat offline:

1. Request POST/PUT/DELETE saat offline akan di-queue ke IndexedDB
2. Saat kembali online, request akan otomatis dikirim ulang
3. User akan mendapat notifikasi hasil sync

### Usage
```jsx
import { useBackgroundSync } from '@hooks/useBackgroundSync';

function MyComponent() {
  const { queueRequest, syncPendingRequests } = useBackgroundSync();
  // ...
}
```

## Offline Storage (IndexedDB)

Utility untuk menyimpan data offline:

```javascript
import { cacheData, getCachedData } from '@utils/offlineStorage';

// Simpan data dengan TTL 60 menit
await cacheData('my-key', myData, 60);

// Ambil cached data
const data = await getCachedData('my-key');
```

## Hooks

### useOnlineStatus
```jsx
import { useOnlineStatus } from '@hooks/useOnlineStatus';

function MyComponent() {
  const { isOnline, isOffline, lastOnlineTime } = useOnlineStatus();
  // ...
}
```

### usePWA
```jsx
import { usePWA } from '@hooks/useOnlineStatus';

function MyComponent() {
  const { needRefresh, offlineReady, updateServiceWorker } = usePWA();
  // ...
}
```

## Regenerate Icons

Jika ingin mengubah icon, edit `generate-icons.cjs` lalu jalankan:

```bash
# Generate SVG icons
node generate-icons.cjs

# Convert ke PNG
node convert-icons.cjs
```

## Testing PWA

### Lighthouse Audit

1. Buka Chrome DevTools (F12)
2. Tab "Lighthouse"
3. Centang "Progressive Web App"
4. Klik "Analyze page load"

### Application Panel

1. Buka Chrome DevTools (F12)
2. Tab "Application"
3. Lihat "Manifest", "Service Workers", dan "Cache Storage"

## Troubleshooting

### PWA tidak muncul opsi install

- Pastikan mengakses via HTTPS (atau localhost)
- Pastikan semua icons tersedia
- Clear cache browser dan reload

### Service Worker tidak update

```javascript
// Di browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

### Manifest error

Cek di DevTools → Application → Manifest untuk melihat error detail.

## Production Deployment

PWA sudah otomatis ter-generate saat build:

```bash
npm run build
```

File yang di-generate di `dist/`:
- `sw.js` - Service Worker
- `workbox-*.js` - Workbox library
- `manifest.webmanifest` - Web App Manifest
- `registerSW.js` - SW registration script
