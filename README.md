# MLBB Shop - Bagian Orang 1

Starter project backend untuk bagian anggota pertama praktikum Pemrograman Web Modul 4.

## Cakupan file ini

Bagian yang sudah disiapkan:

- Setup Express 5 + TypeScript.
- Konfigurasi Prisma ORM 7 + Neon PostgreSQL menggunakan `@prisma/adapter-neon`.
- Schema 4 tabel dan 4 enum sesuai diagram modul.
- Script seed untuk 133 hero, 892 skin, 3 player, dan 4 data PlayerHero.
- Middleware Logger, Error Handler, dan Not Found.
- `GET /health`.
- Hero: `GET /api/heroes`, `GET /api/heroes/:hero_id`, `POST /api/heroes`.
- Skin: `GET /api/skins`, `GET /api/skins/:skin_id`.
- Koleksi Postman untuk endpoint anggota pertama.

Endpoint Player, Top Up, Match, pembelian Hero, dan Statistik sengaja belum dibuat karena menjadi bagian anggota kedua dan ketiga.

## Persiapan

Pastikan Node.js minimal 20.19.0 dan npm sudah terpasang.

### 1. Install dependency

```bash
npm install
```

Setelah instalasi, kamu bisa menjalankan server lebih dulu untuk mengecek Express dan middleware:

```bash
npm run dev
```

Buka `http://localhost:3000/health`. Endpoint health tidak membutuhkan koneksi database. Hentikan server dengan `Ctrl + C` setelah berhasil.

### 2. Buat database Neon

Buat project PostgreSQL di Neon. Salin dua connection string dari dashboard Neon:

- Pooled connection string untuk `DATABASE_URL`.
- Direct connection string untuk `DIRECT_URL`.

Salin `.env.example` menjadi `.env`, lalu isi kedua URL tersebut. Jangan mengunggah `.env` ke GitHub.

### 3. Buat migration dan generate Prisma Client

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Jika perintah migration pertama kali dijalankan, Prisma akan membuat tabel berdasarkan `prisma/schema.prisma`. Prisma Client harus di-generate sebelum menjalankan seed atau endpoint yang membaca database.

### 4. Masukkan dataset

Unduh `heroes.json` dan `skins.json` dari link dataset pada modul, kemudian letakkan di folder `data/`:

```text
data/
  heroes.json
  skins.json
```

Lihat `data/README.md` untuk rincian kolom yang dibaca script seed.

### 5. Jalankan seed

```bash
npm run db:seed
```

Seed akan mengosongkan tabel, memasukkan 133 hero, 892 skin, 3 player, dan 4 PlayerHero sesuai halaman 5 modul. Karena menggunakan `TRUNCATE`, jalankan hanya pada database praktikum yang memang boleh dikosongkan.

### 6. Jalankan server

```bash
npm run dev
```

Buka `http://localhost:3000/health`. Jika berhasil, response memiliki `status: true`.

### 7. Uji dengan Postman

Import file berikut ke Postman:

`postman/MLBB-Shop-Orang-1.postman_collection.json`

Jalankan request satu per satu. Untuk detail hero, ID 1 adalah Miya sesuai urutan dataset modul.

## Endpoint anggota pertama

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | Cek server |
| GET | `/api/heroes?page=1&limit=10` | Semua hero + pagination |
| GET | `/api/heroes?search=miya` | Cari nama hero |
| GET | `/api/heroes?role=MARKSMAN` | Filter role |
| GET | `/api/heroes/:hero_id` | Detail hero + daftar skin |
| POST | `/api/heroes` | Tambah hero |
| GET | `/api/skins?page=1&limit=10` | Semua skin + nama hero |
| GET | `/api/skins?heroId=18` | Filter berdasarkan hero |
| GET | `/api/skins?rarity=GRAND` | Filter rarity |
| GET | `/api/skins/:skin_id` | Detail skin + data hero |

Contoh body `POST /api/heroes`:

```json
{
  "name": "Hero Praktikum Baru",
  "role": "MAGE",
  "lane": "MID",
  "releaseYear": 2026,
  "priceBP": 32000,
  "priceDiamond": 599
}
```

`priceBP` dan `priceDiamond` boleh `null` atau tidak dikirim.

## Catatan integrasi untuk anggota 2 dan 3

1. Gunakan `import { getPrisma } from "../db/prisma.js"` lalu gunakan `const prisma = await getPrisma()` agar semua anggota memakai satu instance Prisma.
2. Gunakan `HttpError` dari `src/utils/http-error.ts` untuk mengirim error terformat.
3. Jangan membuat PrismaClient baru di setiap controller.
4. Tambahkan route Player dan fitur lainnya di `src/app.ts` sebelum middleware `notFound` dan `errorHandler`.
5. Jangan mengubah nama model, field, dan enum karena harus sama dengan requirement modul.
6. Sebelum push, pastikan `.env` tidak ikut ter-commit.

## Struktur folder

```text
mlbb-shop-orang-1/
├── data/
├── postman/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## Hal yang perlu kamu kerjakan sendiri sebelum demo

- Isi `.env` dengan connection string Neon milik kelompok.
- Unduh dua file dataset asli ke folder `data/`.
- Jalankan migration dan seed.
- Jalankan server, uji endpoint dengan Postman, dan pahami alur controller karena setiap anggota wajib menjelaskan bagiannya saat demo.
- Setelah semua anggota menggabungkan fitur, jalankan ulang seluruh testcase modul.
