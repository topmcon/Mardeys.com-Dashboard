# Deployment Guide

> **🚀 NEW: Cloud Deployment Available!**
> 
> For easy cloud deployment on **Render** (backend) and **Vercel** (frontend), see:
> **[DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md)** - Complete step-by-step guide
>
> Cloud deployment offers:
> - ✅ Free tier available
> - ✅ Automatic HTTPS/SSL
> - ✅ CI/CD from GitHub
> - ✅ Global CDN
> - ✅ Auto-scaling
> - ✅ 5-minute setup
>
> The guide below covers traditional VPS/Docker deployment.

---

## Production Deployment Options

### Option 1: Cloud Deployment (Easiest - Recommended for Beginners)

See **[DEPLOYMENT_CLOUD.md](./DEPLOYMENT_CLOUD.md)** for:
- MongoDB Atlas (database)
- Render (backend API)
- Vercel (frontend)

**Perfect for**: Quick setup, no server management, free tier available

---

### Option 2: Docker Deployment (Recommended for VPS)

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

#### Steps

1. **Prepare the server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt install docker-compose-plugin
   ```

2. **Clone and configure**
   ```bash
   git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
   cd Mardeys.com-Dashboard
   
   # Copy and edit environment file
   cp .env.example .env
   nano .env
   ```

3. **Configure production settings**
   ```env
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://yourdomain.com
   MONGODB_URI=mongodb://admin:STRONG_PASSWORD@mongodb:27017/mardeys-dashboard?authSource=admin
   JWT_SECRET=GENERATE_STRONG_64_CHAR_SECRET
   ```

4. **Update docker-compose.yml for production**
   ```yaml
   version: '3.8'
   
   services:
     mongodb:
       image: mongo:7
       restart: always
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
       volumes:
         - mongodb_data:/data/db
       networks:
         - internal
   
     backend:
       build:
         context: .
         dockerfile: Dockerfile.backend
       restart: always
       environment:
         NODE_ENV: production
       env_file:
         - .env
       depends_on:
         - mongodb
       networks:
         - internal
         - web
   
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       restart: always
       depends_on:
         - backend
       networks:
         - web
   
   volumes:
     mongodb_data:
   
   networks:
     internal:
       internal: true
     web:
       external: true
   ```

5. **Deploy with SSL (using Caddy)**
   
   Create `Caddyfile`:
   ```
   yourdomain.com {
       reverse_proxy frontend:80
   }
   
   api.yourdomain.com {
       reverse_proxy backend:5000
   }
   ```

6. **Start services**
   ```bash
   docker-compose up -d --build
   ```

7. **Verify deployment**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

### Option 2: VPS Deployment with PM2

#### Prerequisites
- Ubuntu 22.04 LTS (or similar)
- Node.js 18+
- MongoDB 7+
- Nginx
- PM2

#### Steps

1. **Install dependencies**
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt update
   sudo apt install -y mongodb-org

   # PM2
   sudo npm install -g pm2

   # Nginx
   sudo apt install -y nginx
   ```

2. **Clone and build**
   ```bash
   cd /var/www
   git clone https://github.com/topmcon/Mardeys.com-Dashboard.git
   cd Mardeys.com-Dashboard
   
   # Install backend dependencies
   npm install --production
   
   # Build frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. **Set up MongoDB**
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Secure MongoDB
   mongosh
   > use admin
   > db.createUser({
       user: "admin",
       pwd: "STRONG_PASSWORD",
       roles: ["root"]
     })
   > exit
   
   # Enable authentication in /etc/mongod.conf
   sudo nano /etc/mongod.conf
   # Add:
   # security:
   #   authorization: enabled
   
   sudo systemctl restart mongod
   ```

5. **Start backend with PM2**
   ```bash
   pm2 start backend/server.js --name mardeys-backend
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   
   Create `/etc/nginx/sites-available/mardeys`:
   ```nginx
   # Frontend
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /var/www/Mardeys.com-Dashboard/frontend/build;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       # WebSocket
       location /socket {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mardeys /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set up SSL with Certbot**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   sudo certbot renew --dry-run
   ```

### Option 3: DigitalOcean App Platform

1. **Prepare repository**
   - Push code to GitHub
   - Ensure `.env.example` is complete

2. **Create new app**
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Select branch

3. **Configure components**
   
   **Backend:**
   - Type: Web Service
   - Build Command: `npm install`
   - Run Command: `node backend/server.js`
   - Environment Variables: Add all from `.env.example`

   **Frontend:**
   - Type: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`

   **Database:**
   - Add MongoDB managed database
   - Update MONGODB_URI in backend environment

4. **Deploy**
   - Click "Create Resources"
   - Wait for build and deployment

### Option 4: Heroku Deployment

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   heroku login
   ```

2. **Create apps**
   ```bash
   # Backend
   heroku create mardeys-backend
   
   # Frontend
   heroku create mardeys-frontend
   ```

3. **Add MongoDB**
   ```bash
   heroku addons:create mongolab:sandbox -a mardeys-backend
   ```

4. **Configure environment**
   ```bash
   heroku config:set NODE_ENV=production -a mardeys-backend
   heroku config:set JWT_SECRET=your-secret -a mardeys-backend
   # ... add all other environment variables
   ```

5. **Deploy backend**
   ```bash
   git subtree push --prefix backend heroku main
   ```

6. **Deploy frontend**
   ```bash
   cd frontend
   git init
   heroku git:remote -a mardeys-frontend
   git add .
   git commit -m "Deploy"
   git push heroku main
   ```

## Post-Deployment Checklist

- [ ] Create admin user
- [ ] Test all API endpoints
- [ ] Verify monitoring services are running
- [ ] Test email notifications
- [ ] Test Slack notifications (if configured)
- [ ] Verify WebSocket connections
- [ ] Check MongoDB indexes
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Uptime Robot, etc.)
- [ ] Update DNS records
- [ ] Test from multiple devices
- [ ] Enable firewall rules
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Review security settings

## Monitoring Production

### PM2 Commands
```bash
pm2 status                    # View status
pm2 logs mardeys-backend      # View logs
pm2 restart mardeys-backend   # Restart app
pm2 monit                     # Monitor resources
```

### Docker Commands
```bash
docker-compose ps             # View containers
docker-compose logs -f        # Stream logs
docker-compose restart        # Restart all
docker stats                  # Resource usage
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

## Backup Strategy

### Database Backups
```bash
# Create backup script: /usr/local/bin/backup-mongodb.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://admin:password@localhost:27017/mardeys-dashboard" --out=/backups/mongodb_$DATE
find /backups -name "mongodb_*" -mtime +7 -exec rm -rf {} \;

# Add to crontab
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### Application Backups
```bash
# Backup application files daily
tar -czf /backups/app_$(date +%Y%m%d).tar.gz /var/www/Mardeys.com-Dashboard
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Run multiple backend instances
- Use Redis for session storage
- Implement message queue (RabbitMQ, Redis)

### Database Scaling
- MongoDB replica sets
- Read replicas for analytics
- Sharding for large datasets

### Caching
- Redis for frequently accessed data
- CDN for static assets
- Database query caching

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs mardeys-backend --lines 100

# Check environment variables
pm2 env 0

# Verify MongoDB connection
mongosh $MONGODB_URI
```

### High CPU/Memory usage
```bash
# Check resource usage
pm2 monit

# Restart application
pm2 restart mardeys-backend

# Check for memory leaks
node --inspect backend/server.js
```

### Database issues
```bash
# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Verify indexes
mongosh
> use mardeys-dashboard
> db.metrics.getIndexes()
> db.alerts.getIndexes()
```

## Security Hardening

1. **Firewall rules**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

2. **Disable MongoDB external access**
   ```
   # /etc/mongod.conf
   net:
     bindIp: 127.0.0.1
   ```

3. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade
   npm audit fix
   ```

4. **Fail2ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

## Maintenance

### Regular tasks
- Weekly security updates
- Monthly dependency updates
- Quarterly penetration testing
- Daily backup verification
- Weekly log review

### Update procedure
```bash
# Backup first
./backup.sh

# Pull updates
git pull origin main

# Update dependencies
npm install
cd frontend && npm install && npm run build

# Restart
pm2 restart mardeys-backend
```
