# Plan: Fix GitHub Pages 404 Assets (Vite PWA)

## Konteks
Deploy GH Pages di subfolder `/Justify/` blank/404 karena path aset absolute tidak ter-prefix base. Request user:
1. `vite.config.js` set `base: '/Justify/'`
2. `index.html` script src jadi `./src/main.jsx`
3. Verifikasi referensi aset public/src pakai base/relative paths

## Temuan Saat Ini (Read-Only Audit)
- `vite.config.js`: sudah `base: '/Justify/'`, `scope: '/Justify/'`, `start_url: '/Justify/'` → task 1 sudah terpenuhi, tinggal verifikasi idempoten.
- `index.html:8` `href="/logo.svg"` absolute, `index.html:19` `src="/src/main.jsx"` absolute → perlu ubah ke `./src/main.jsx` sesuai permintaan; `href` favicon juga perlu relative `./logo.svg` atau `%BASE_URL%` agar tidak 404.
- `src/App.jsx:259` `src="/logo.svg"`, `:312`, `:325`, `:396` `src={current?.coverUrl || '/logo.svg'}` → semua hardcoded `/logo.svg` runtime JSX, tidak diproses Vite → 404 di `/Justify/`. Perlu `${import.meta.env.BASE_URL}logo.svg`.
- `src/components/*`: hanya pakai `FALLBACK_COVER` (unsplash eksternal) + coverUrl blob → aman.
- `public/logo.svg`, `public/icons/*`: ada, akan di-copy Vite ke `dist/` root, butuh referensi dengan BASE_URL.

## Rencana Perubahan (3 File)
### 1. `vite.config.js` — Verifikasi
- Pastikan `base: '/Justify/'` tetap ada (sudah ada). No-op jika sudah benar. Jangan duplikat.
- Alternative lazier: pakai `base: './'` untuk relative, tapi user minta `/Justify/` eksplisit → ikuti user.

### 2. `index.html` — Wajib Edit
```diff
- <link rel="icon" href="/logo.svg" />
+ <link rel="icon" href="./logo.svg" />
- <script type="module" src="/src/main.jsx"></script>
+ <script type="module" src="./src/main.jsx"></script>
```
Catatan: Vite akan rewrite `./src/main.jsx` + prepend base saat build → `dist/index.html` jadi `/Justify/assets/...` + favicon `./logo.svg` → resolved ke `/Justify/logo.svg`.

### 3. `src/App.jsx` — Wajib Edit (4 lokasi)
Opsi A (recommended, Vite-native): 
```js
const LOGO = `${import.meta.env.BASE_URL}logo.svg`
<img src={current?.coverUrl || LOGO} />
```
Ganti di lines 259, 312, 325, 396. 
Opsi B: `import logo from '/logo.svg'` lalu `src={logo}` → Vite akan hash & prefix base otomatis. Lebih aman tapi ubah import.
Pilih Opsi A untuk diff minimal.

### 4. `src/lib/utils.js` — Tidak perlu
`FALLBACK_COVER` eksternal unsplash → biarkan.

### 5. Verifikasi
- `npm run build` → cek `dist/index.html` mengandung `src="/Justify/assets/` dan `href="/Justify/logo.svg"` atau `./logo.svg`.
- `grep -r '"/logo.svg"' src/` harus 0 setelah fix.
- `grep -r '"/src/'` harus 0.

## Risiko & Tradeoff
- `./src/main.jsx` relatif: dev server Vite tetap support, tapi HMR path relatif kadang warning di console — negligible.
- `BASE_URL` di App.jsx: butuh `import.meta.env` yang hanya ada di Vite build, aman untuk GH Pages.

## Urutan Eksekusi
1. Edit `index.html` (2 lines)
2. Edit `src/App.jsx` (tambah const LOGO + 4 replace)
3. `npm run build` verifikasi
4. Commit `fix: gh pages 404 - base and relative asset paths`

## Pertanyaan ke User
- Setuju pakai `${import.meta.env.BASE_URL}logo.svg` atau prefer `import logo from '/logo.svg'`?
- Favicon `href` mau `./logo.svg` atau `"/Justify/logo.svg"` eksplisit?
