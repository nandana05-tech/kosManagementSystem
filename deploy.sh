#!/bin/bash
# =====================================================
# Deploy Script untuk kos-wisnu.my.id
# Jalankan di VM Google Compute Engine
# =====================================================

set -e

DOMAIN="kos-wisnu.my.id"
PROJECT_DIR="kosManagementSystem"

echo "=========================================="
echo "Deployment Script untuk $DOMAIN"
echo "=========================================="

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
    echo "[ERROR] Jangan jalankan sebagai root. Gunakan user biasa."
    exit 1
fi

# Step 1: Check Docker
echo ""
echo "[Step 1] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "[WARNING] Docker installed. Please logout and login again, then run this script again."
    exit 0
fi
echo "[OK] Docker OK"

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
echo "[OK] Docker Compose OK"

# Step 2: Check if project exists
echo ""
echo "[Step 2] Checking project directory..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Cloning repository..."
    git clone https://github.com/nandana05-tech/kosManagementSystem.git
fi
cd $PROJECT_DIR
echo "[OK] Project directory OK"

# Step 3: Setup environment
echo ""
echo "[Step 3] Setting up environment..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo "[WARNING] .env created from .env.production"
        echo "   PENTING: Edit .env dan ganti password/secrets!"
        echo "   Jalankan: nano .env"
        exit 0
    else
        cp .env.example .env
        echo "[WARNING] .env created from .env.example"
        echo "   PENTING: Edit .env untuk production!"
        exit 0
    fi
fi
echo "[OK] Environment file OK"

# Step 4: Check SSL certificates
echo ""
echo "[Step 4] Checking SSL certificates..."
if [ ! -f "docker/nginx/ssl/cert.pem" ]; then
    echo "[WARNING] SSL certificate not found!"
    echo ""
    echo "Jalankan perintah berikut untuk generate SSL:"
    echo ""
    echo "1. Stop containers:"
    echo "   docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
    echo ""
    echo "2. Install certbot:"
    echo "   sudo apt install -y certbot"
    echo ""
    echo "3. Generate certificate:"
    echo "   sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "4. Copy certificate:"
    echo "   mkdir -p docker/nginx/ssl"
    echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/cert.pem"
    echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/key.pem"
    echo "   sudo chmod 644 docker/nginx/ssl/*.pem"
    echo ""
    echo "5. Jalankan script ini lagi"
    exit 0
fi
echo "[OK] SSL certificates OK"

# Step 5: Use production nginx config
echo ""
echo "[Step 5] Setting up nginx config..."
if [ -f "docker/nginx/nginx.prod.conf" ]; then
    cp docker/nginx/nginx.prod.conf docker/nginx/nginx.conf
    echo "[OK] Production nginx config applied"
else
    echo "[WARNING] nginx.prod.conf not found, using existing nginx.conf"
fi

# Step 6: Build and deploy
echo ""
echo "[Step 6] Building and deploying..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Step 7: Wait for containers
echo ""
echo "Waiting for containers to start..."
sleep 10

# Step 8: Run migrations
echo ""
echo "[Step 7] Running database migrations..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy || true

# Step 9: Health check
echo ""
echo "[Step 8] Health check..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200"; then
    echo "[OK] API Health check passed"
else
    echo "[WARNING] API might still be starting..."
fi

# Done
echo ""
echo "=========================================="
echo "[OK] Deployment Complete!"
echo "=========================================="
echo ""
echo "Website: https://$DOMAIN"
echo "API:     https://$DOMAIN/api"
echo ""
echo "Useful commands:"
echo "   View logs:    docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "   Restart:      docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo "   Stop:         docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo ""
