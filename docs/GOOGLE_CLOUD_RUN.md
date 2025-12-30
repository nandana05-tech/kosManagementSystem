# Deployment ke Google Cloud Run

Panduan lengkap untuk mendeploy KosManagementSystem ke Google Cloud Run.

## Arsitektur Deployment

```mermaid
graph TB
    subgraph "Google Cloud Platform"
        subgraph "Cloud Run Services"
            FE[Frontend Service<br/>kos-frontend]
            BE[Backend Service<br/>kos-backend]
        end
        
        subgraph "Cloud SQL"
            DB[(PostgreSQL 15)]
        end
        
        subgraph "Cloud Storage"
            GCS[Bucket: kos-uploads<br/>Images & Files]
        end
        
        subgraph "Container Registry"
            GCR[gcr.io/project-id<br/>Docker Images]
        end
    end
    
    User((User)) --> FE
    FE --> BE
    BE --> DB
    BE --> GCS
    GCR --> FE
    GCR --> BE
```

---

## Prerequisites

### Tools yang Dibutuhkan

| Tool | Deskripsi | Link |
|------|-----------|------|
| **Google Cloud SDK** | CLI untuk GCP | [Install gcloud](https://cloud.google.com/sdk/docs/install) |
| **Docker Desktop** | Build container images | [Install Docker](https://www.docker.com/products/docker-desktop/) |
| **Git** | Version control | [Install Git](https://git-scm.com/) |

### Akun & Billing

- [ ] Akun Google Cloud Platform
- [ ] Billing sudah diaktifkan
- [ ] Project GCP sudah dibuat

---

## Step 1: Setup Google Cloud Project

### 1.1 Login dan Konfigurasi gcloud

```bash
# Login ke Google Cloud
gcloud auth login

# Buat project baru (atau skip jika sudah ada)
gcloud projects create kos-management-prod --name="Kos Management System"

# Set project aktif
gcloud config set project kos-management-prod

# Verifikasi project
gcloud config get-value project
```

### 1.2 Enable Required APIs

```bash
# Enable semua API yang diperlukan
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com
```

### 1.3 Set Default Region

```bash
# Set region default (pilih yang terdekat)
gcloud config set run/region asia-southeast1
gcloud config set compute/region asia-southeast1
```

> **💡 Tip:** Region `asia-southeast1` (Singapore) adalah yang terdekat untuk Indonesia.

---

## Step 2: Setup Cloud SQL (PostgreSQL)

### 2.1 Buat Cloud SQL Instance

```bash
# Buat instance PostgreSQL
gcloud sql instances create kos-db-instance \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-southeast1 \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00

# Tunggu sampai instance ready (~5-10 menit)
echo "Menunggu instance ready..."
gcloud sql instances describe kos-db-instance --format="value(state)"
```

### 2.2 Buat Database dan User

```bash
# Buat database
gcloud sql databases create kos_management --instance=kos-db-instance

# Set password untuk user postgres (GANTI dengan password kuat!)
gcloud sql users set-password postgres \
  --instance=kos-db-instance \
  --password="YOUR_SECURE_DB_PASSWORD_HERE"
```

### 2.3 Dapatkan Connection Name

```bash
# Catat connection name untuk digunakan nanti
gcloud sql instances describe kos-db-instance \
  --format="value(connectionName)"

# Output format: PROJECT_ID:REGION:INSTANCE_NAME
# Contoh: kos-management-prod:asia-southeast1:kos-db-instance
```

---

## Step 3: Setup Cloud Storage (untuk Uploads)

### 3.1 Buat Bucket

```bash
# Buat bucket untuk menyimpan uploads
gsutil mb -l asia-southeast1 gs://kos-management-uploads

# Set bucket agar public readable (untuk gambar)
gsutil iam ch allUsers:objectViewer gs://kos-management-uploads
```

### 3.2 Set CORS Policy

Buat file `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:

```bash
gsutil cors set cors.json gs://kos-management-uploads
```

---

## Step 4: Setup Secret Manager

### 4.1 Buat Secrets untuk Environment Variables

```bash
# JWT Secret (generate random string)
echo -n "$(openssl rand -hex 64)" | \
  gcloud secrets create jwt-secret --data-file=-

# Database Password
echo -n "YOUR_SECURE_DB_PASSWORD_HERE" | \
  gcloud secrets create db-password --data-file=-

# Midtrans Server Key
echo -n "your-midtrans-server-key" | \
  gcloud secrets create midtrans-server-key --data-file=-

# Midtrans Client Key
echo -n "your-midtrans-client-key" | \
  gcloud secrets create midtrans-client-key --data-file=-

# SMTP Password
echo -n "your-smtp-app-password" | \
  gcloud secrets create smtp-password --data-file=-
```

### 4.2 Berikan Akses ke Cloud Run Service Account

```bash
# Get Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) \
  --format="value(projectNumber)")

SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access ke semua secrets
for SECRET in jwt-secret db-password midtrans-server-key midtrans-client-key smtp-password; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Step 5: Modifikasi Dockerfile untuk Cloud Run

### 5.1 Backend Dockerfile untuk Cloud Run

Buat file `backend/Dockerfile.cloudrun`:

```dockerfile
# Backend Dockerfile untuk Cloud Run
FROM node:18-bullseye-slim AS production

WORKDIR /app

# Install OpenSSL untuk Prisma dan libvips untuk Sharp
RUN apt-get update -y && \
    apt-get install -y openssl libvips-dev && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm install sharp

# Copy Prisma schema dan generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Cloud Run menggunakan PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start script yang menjalankan migration + server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### 5.2 Frontend Dockerfile untuk Cloud Run

Buat file `frontend/Dockerfile.cloudrun`:

```dockerfile
# Frontend Dockerfile untuk Cloud Run
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build dengan API URL pointing ke backend Cloud Run
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage dengan nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config untuk Cloud Run
COPY nginx.cloudrun.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 5.3 Buat Nginx Config untuk Cloud Run

Buat file `frontend/nginx.cloudrun.conf`:

```nginx
server {
    listen 8080;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # SPA routing - semua route ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
```

---

## Step 6: Build dan Push Docker Images

### 6.1 Konfigurasi Docker untuk GCR

```bash
# Konfigurasi Docker auth untuk GCR
gcloud auth configure-docker
```

### 6.2 Build dan Push Backend

```bash
# Masuk ke direktori project
cd /path/to/kosManagementSystem

# Build backend image
docker build \
  -t gcr.io/kos-management-prod/kos-backend:latest \
  -f backend/Dockerfile.cloudrun \
  ./backend

# Push ke GCR
docker push gcr.io/kos-management-prod/kos-backend:latest
```

### 6.3 Build dan Push Frontend

```bash
# Build frontend image
# Ganti BACKEND_URL dengan URL backend yang akan dideploy
docker build \
  -t gcr.io/kos-management-prod/kos-frontend:latest \
  -f frontend/Dockerfile.cloudrun \
  --build-arg VITE_API_URL=https://kos-backend-xxxxx-as.a.run.app/api \
  ./frontend

# Push ke GCR
docker push gcr.io/kos-management-prod/kos-frontend:latest
```

---

## Step 7: Deploy ke Cloud Run

### 7.1 Deploy Backend Service

```bash
# Get project ID dan connection name
PROJECT_ID=$(gcloud config get-value project)
CLOUD_SQL_CONNECTION="${PROJECT_ID}:asia-southeast1:kos-db-instance"

# Deploy backend
gcloud run deploy kos-backend \
  --image gcr.io/${PROJECT_ID}/kos-backend:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --add-cloudsql-instances ${CLOUD_SQL_CONNECTION} \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "POSTGRES_USER=postgres" \
  --set-env-vars "POSTGRES_DB=kos_management" \
  --set-env-vars "SMTP_HOST=smtp.gmail.com" \
  --set-env-vars "SMTP_PORT=587" \
  --set-env-vars "SMTP_USER=your-email@gmail.com" \
  --set-env-vars "EMAIL_FROM=noreply@kostmanagement.com" \
  --set-env-vars "MIDTRANS_IS_PRODUCTION=false" \
  --set-secrets "JWT_SECRET=jwt-secret:latest" \
  --set-secrets "POSTGRES_PASSWORD=db-password:latest" \
  --set-secrets "MIDTRANS_SERVER_KEY=midtrans-server-key:latest" \
  --set-secrets "MIDTRANS_CLIENT_KEY=midtrans-client-key:latest" \
  --set-secrets "SMTP_PASS=smtp-password:latest"
```

### 7.2 Update DATABASE_URL

Setelah deploy, update dengan DATABASE_URL yang benar:

```bash
# Format connection untuk Cloud SQL
# postgresql://USER:PASSWORD@localhost/DATABASE?host=/cloudsql/CONNECTION_NAME

gcloud run services update kos-backend \
  --region asia-southeast1 \
  --update-env-vars "DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD}@localhost/kos_management?host=/cloudsql/${CLOUD_SQL_CONNECTION}"
```

### 7.3 Dapatkan Backend URL

```bash
# Dapatkan URL backend
BACKEND_URL=$(gcloud run services describe kos-backend \
  --region asia-southeast1 \
  --format="value(status.url)")

echo "Backend URL: ${BACKEND_URL}"
# Contoh: https://kos-backend-xxxxx-as.a.run.app
```

### 7.4 Rebuild Frontend dengan Backend URL

```bash
# Rebuild frontend dengan URL backend yang benar
docker build \
  -t gcr.io/${PROJECT_ID}/kos-frontend:latest \
  -f frontend/Dockerfile.cloudrun \
  --build-arg VITE_API_URL=${BACKEND_URL}/api \
  ./frontend

docker push gcr.io/${PROJECT_ID}/kos-frontend:latest
```

### 7.5 Deploy Frontend Service

```bash
# Deploy frontend
gcloud run deploy kos-frontend \
  --image gcr.io/${PROJECT_ID}/kos-frontend:latest \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5

# Dapatkan URL frontend
FRONTEND_URL=$(gcloud run services describe kos-frontend \
  --region asia-southeast1 \
  --format="value(status.url)")

echo "Frontend URL: ${FRONTEND_URL}"
```

### 7.6 Update Backend dengan Frontend URL

```bash
# Update FRONTEND_URL di backend untuk CORS dan email links
gcloud run services update kos-backend \
  --region asia-southeast1 \
  --update-env-vars "FRONTEND_URL=${FRONTEND_URL}"
```

---

## Step 8: Setup Custom Domain (Opsional)

### 8.1 Mapping Domain ke Cloud Run

```bash
# Mapping custom domain ke frontend
gcloud run domain-mappings create \
  --service kos-frontend \
  --domain your-domain.com \
  --region asia-southeast1

# Mapping subdomain untuk API
gcloud run domain-mappings create \
  --service kos-backend \
  --domain api.your-domain.com \
  --region asia-southeast1
```

### 8.2 Update DNS Records

Ikuti instruksi yang diberikan oleh gcloud untuk menambahkan DNS records di domain registrar Anda.

---

## Step 9: Jalankan Database Migration

### 9.1 Connect ke Cloud SQL

```bash
# Install Cloud SQL Auth Proxy
# Download dari: https://cloud.google.com/sql/docs/postgres/connect-admin-proxy

# Jalankan proxy
./cloud_sql_proxy -instances=${PROJECT_ID}:asia-southeast1:kos-db-instance=tcp:5432

# Di terminal lain, jalankan migration
cd backend
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kos_management" npx prisma migrate deploy
```

### 9.2 Seed Data Awal (Opsional)

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/kos_management" npx prisma db seed
```

---

## Step 10: Konfigurasi Midtrans

Update URL di Midtrans Dashboard:

| Setting | Value |
|---------|-------|
| **Finish Redirect URL** | `https://kos-frontend-xxx.run.app/payment/finish` |
| **Unfinish Redirect URL** | `https://kos-frontend-xxx.run.app/payment/unfinish` |
| **Error Redirect URL** | `https://kos-frontend-xxx.run.app/payment/error` |
| **Notification URL** | `https://kos-backend-xxx.run.app/api/payment/notification` |

---

## Verifikasi Deployment

### Health Check

```bash
# Test backend health
curl ${BACKEND_URL}/api/health

# Test frontend
curl ${FRONTEND_URL}
```

### Logs

```bash
# Lihat logs backend
gcloud run services logs read kos-backend --region asia-southeast1

# Stream logs realtime
gcloud run services logs tail kos-backend --region asia-southeast1
```

---

## Troubleshooting

### Error: Connection Refused to Database

Pastikan Cloud SQL connection sudah benar:

```bash
# Verifikasi Cloud SQL instances
gcloud run services describe kos-backend \
  --region asia-southeast1 \
  --format="value(spec.template.metadata.annotations)"
```

### Error: Permission Denied untuk Secrets

```bash
# Verifikasi IAM permissions
gcloud secrets get-iam-policy jwt-secret
```

### Cold Start Lambat

Tingkatkan min-instances:

```bash
gcloud run services update kos-backend \
  --region asia-southeast1 \
  --min-instances 1
```

---

## Estimasi Biaya

| Service | Tier | Estimasi/Bulan |
|---------|------|----------------|
| **Cloud Run** (Backend) | 512Mi, scale to 0 | ~$5-20 |
| **Cloud Run** (Frontend) | 256Mi, scale to 0 | ~$2-10 |
| **Cloud SQL** | db-f1-micro | ~$10-15 |
| **Cloud Storage** | 10GB | ~$0.50 |
| **Total** | | **~$17-45/bulan** |

> **💡 Tips Hemat:**
> - Gunakan `min-instances=0` untuk scale to zero
> - Pilih tier Cloud SQL terkecil untuk development
> - Monitor usage di Cloud Console

---

## Deployment Script (All-in-One)

Simpan sebagai `deploy-cloudrun.sh`:

```bash
#!/bin/bash
set -e

PROJECT_ID="kos-management-prod"
REGION="asia-southeast1"
DB_INSTANCE="kos-db-instance"

echo "🚀 Starting deployment to Google Cloud Run..."

# 1. Build and push images
echo "📦 Building Docker images..."
docker build -t gcr.io/${PROJECT_ID}/kos-backend:latest -f backend/Dockerfile.cloudrun ./backend
docker build -t gcr.io/${PROJECT_ID}/kos-frontend:latest -f frontend/Dockerfile.cloudrun ./frontend

echo "⬆️ Pushing to Container Registry..."
docker push gcr.io/${PROJECT_ID}/kos-backend:latest
docker push gcr.io/${PROJECT_ID}/kos-frontend:latest

# 2. Deploy backend
echo "🔧 Deploying backend..."
gcloud run deploy kos-backend \
  --image gcr.io/${PROJECT_ID}/kos-backend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated

# 3. Deploy frontend
echo "🎨 Deploying frontend..."
gcloud run deploy kos-frontend \
  --image gcr.io/${PROJECT_ID}/kos-frontend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated

echo "✅ Deployment complete!"
echo "Frontend: $(gcloud run services describe kos-frontend --region ${REGION} --format='value(status.url)')"
echo "Backend: $(gcloud run services describe kos-backend --region ${REGION} --format='value(status.url)')"
```

---

## Quick Reference Commands

```bash
# Lihat semua services
gcloud run services list

# Update service
gcloud run services update SERVICE_NAME --region asia-southeast1

# Delete service
gcloud run services delete SERVICE_NAME --region asia-southeast1

# Lihat revisions
gcloud run revisions list --service=kos-backend

# Rollback ke revisions sebelumnya
gcloud run services update-traffic kos-backend \
  --to-revisions REVISION_NAME=100
```
