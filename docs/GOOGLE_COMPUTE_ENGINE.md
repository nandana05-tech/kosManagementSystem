# Deployment ke Google Compute Engine

Panduan deployment KosManagementSystem ke Google Compute Engine dengan domain **kos-wisnu.my.id**.

## Estimasi Biaya

| Komponen | Spesifikasi | Biaya/Bulan |
|----------|-------------|-------------|
| VM e2-micro | 0.25 vCPU, 1GB RAM | ~$6 |
| Boot Disk | 30GB SSD | ~$5 |
| Static IP | 1 IP | ~$3 |
| **Total** | | **~$14-15/bulan** |

---

## Prerequisites

- [x] Akun Google Cloud dengan billing aktif
- [x] Domain `kos-wisnu.my.id` sudah dibeli
- [ ] [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) terinstall

---

## Step 1: Setup GCP dan Buat VM

```bash
# Login ke Google Cloud
gcloud auth login

# Set project
gcloud config set project kos-wisnu

# Enable Compute Engine API
gcloud services enable compute.googleapis.com

# Buat VM
gcloud compute instances create kos-server \
  --zone=asia-southeast1-b \
  --machine-type=e2-micro \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# Setup firewall
gcloud compute firewall-rules create allow-http --allow tcp:80 --target-tags=http-server
gcloud compute firewall-rules create allow-https --allow tcp:443 --target-tags=https-server
```

---

## Step 2: Reserve Static IP

```bash
# Buat static IP
gcloud compute addresses create kos-static-ip --region=asia-southeast1

# Lihat IP address
gcloud compute addresses describe kos-static-ip --region=asia-southeast1 --format="value(address)"

# Catat IP ini untuk DNS setup!
```

---

## Step 3: Setup DNS

Di panel registrar domain Anda, tambahkan DNS record:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `[STATIC_IP]` | 300 |
| A | www | `[STATIC_IP]` | 300 |

Tunggu 5-15 menit, lalu verifikasi:
```bash
ping kos-wisnu.my.id
```

---

## Step 4: SSH ke VM

```bash
gcloud compute ssh kos-server --zone=asia-southeast1-b
```

---

## Step 5: Install Docker

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# PENTING: Logout dan login lagi
exit
```

Reconnect:
```bash
gcloud compute ssh kos-server --zone=asia-southeast1-b
```

---

## Step 6: Clone Repository

```bash
git clone https://github.com/nandana05-tech/kosManagementSystem.git
cd kosManagementSystem
```

---

## Step 7: Setup Environment

```bash
# Copy template production
cp .env.production .env

# Edit environment
nano .env
```

**Yang perlu diganti:**

| Variable | Contoh Value |
|----------|--------------|
| `POSTGRES_PASSWORD` | `MySecurePassword123!` |
| `JWT_SECRET` | `[hasil dari: openssl rand -hex 64]` |
| `MIDTRANS_SERVER_KEY` | Key dari Midtrans dashboard |
| `MIDTRANS_CLIENT_KEY` | Key dari Midtrans dashboard |
| `SMTP_USER` | Email Gmail Anda |
| `SMTP_PASS` | App Password Gmail |

**Generate JWT Secret:**
```bash
openssl rand -hex 64
```

---

## Step 8: Generate SSL Certificate

```bash
# Install certbot
sudo apt install -y certbot

# Generate SSL (pastikan domain sudah pointing ke IP)
sudo certbot certonly --standalone -d kos-wisnu.my.id -d www.kos-wisnu.my.id

# Copy certificate ke project
mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/kos-wisnu.my.id/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/kos-wisnu.my.id/privkey.pem docker/nginx/ssl/key.pem
sudo chmod 644 docker/nginx/ssl/*.pem
```

---

## Step 9: Apply Production Nginx Config

```bash
# Gunakan config HTTPS production
cp docker/nginx/nginx.prod.conf docker/nginx/nginx.conf
```

---

## Step 10: Build dan Deploy

```bash
# Build dan jalankan
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Tunggu ~2-3 menit untuk build

# Cek status containers
docker ps
```

**Output yang diharapkan:**
```
CONTAINER ID   IMAGE          STATUS          PORTS
xxxxx          kos-nginx      Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
xxxxx          kos-backend    Up              5000/tcp
xxxxx          kos-frontend   Up              80/tcp
xxxxx          postgres       Up (healthy)    5432/tcp
```

---

## Step 11: Jalankan Migration

```bash
# Apply database migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed data awal (opsional)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## Step 12: Verifikasi

Buka di browser:
- 🔒 https://kos-wisnu.my.id - Harus ada gembok hijau!
- Test login dengan credentials dari seed

**Default credentials setelah seed:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kostmanagement.com | admin123 |

---

## Quick Deploy (Alternatif)

Jika semua prerequisites sudah terpenuhi, gunakan script otomatis:

```bash
# Clone repository
git clone https://github.com/nandana05-tech/kosManagementSystem.git
cd kosManagementSystem

# Jalankan deploy script
chmod +x deploy.sh
./deploy.sh
```

Script akan guide Anda step-by-step.

---

## Maintenance

### View Logs
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

### Update Aplikasi
```bash
git pull origin main
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Backup Database
```bash
docker exec kos-postgres pg_dump -U postgres kos_management > backup_$(date +%Y%m%d).sql
```

### Renew SSL Certificate
```bash
# Stop nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop nginx

# Renew
sudo certbot renew

# Copy certificate baru
sudo cp /etc/letsencrypt/live/kos-wisnu.my.id/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/kos-wisnu.my.id/privkey.pem docker/nginx/ssl/key.pem

# Start nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml start nginx
```

### Stop/Start VM (Hemat Biaya)
```bash
# Stop VM (disk tetap bayar, tapi VM tidak)
gcloud compute instances stop kos-server --zone=asia-southeast1-b

# Start VM
gcloud compute instances start kos-server --zone=asia-southeast1-b
```

---

## Troubleshooting

### Container tidak jalan
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### SSL Error
Pastikan certificate sudah ter-copy dengan benar:
```bash
ls -la docker/nginx/ssl/
# Harus ada cert.pem dan key.pem
```

### Out of Memory (e2-micro)
```bash
# Tambah swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Checklist Deployment

- [ ] VM sudah dibuat
- [ ] Static IP sudah di-reserve
- [ ] DNS sudah pointing ke IP
- [ ] Docker & Docker Compose terinstall
- [ ] Repository sudah di-clone
- [ ] `.env` sudah dikonfigurasi dengan password kuat
- [ ] SSL certificate sudah di-generate
- [ ] `nginx.prod.conf` sudah di-apply
- [ ] Containers sudah running
- [ ] Database migration sudah dijalankan
- [ ] Website bisa diakses via HTTPS dengan gembok hijau 🔒
