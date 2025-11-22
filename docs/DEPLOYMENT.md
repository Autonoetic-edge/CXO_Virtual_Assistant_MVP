# Deployment Guide

This guide covers deployment of the CXO Virtual Assistant to production environments.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring Setup](#monitoring-setup)
8. [Backup Strategy](#backup-strategy)

## Prerequisites

### Required Software
- Docker 24+ and Docker Compose 2.20+
- Kubernetes 1.27+ (for K8s deployment)
- kubectl configured with cluster access
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)

### Required Services
- PostgreSQL 15+ (managed service recommended)
- Redis 7+ (managed service recommended)
- SendGrid account (for emails)
- OpenAI API key or Anthropic API key
- Google Cloud Project (for Calendar API)

## Docker Deployment

### 1. Production Environment Setup

Create production environment file:
```bash
cp .env.example .env.production
```

Edit `.env.production` with production values:
```bash
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.yourcompany.ai

# Production Database
DATABASE_URL=postgresql://user:password@your-db-host:5432/cxo_assistant

# Production Redis
REDIS_URL=redis://your-redis-host:6379

# Strong JWT Secret
JWT_SECRET=your-very-strong-random-secret-key-here

# Production OAuth
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_REDIRECT_URI=https://api.yourcompany.ai/api/v1/auth/google/callback

# SendGrid
SENDGRID_API_KEY=your-production-sendgrid-api-key
SENDGRID_FROM_EMAIL=assistant@yourcompany.ai

# OpenAI
OPENAI_API_KEY=your-production-openai-api-key

# Frontend
WEB_APP_URL=https://app.yourcompany.ai
```

### 2. Build Production Images

```bash
# Build backend image
docker build -t cxo-assistant-backend:latest ./backend --target production

# Build web image
docker build -t cxo-assistant-web:latest ./web --target production
```

### 3. Run with Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  backend:
    image: cxo-assistant-backend:latest
    container_name: cxo-backend-prod
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: cxo-assistant-web:latest
    container_name: cxo-web-prod
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
    depends_on:
      - backend
    volumes:
      - ./ssl:/etc/nginx/ssl:ro

  postgres:
    image: postgres:15-alpine
    container_name: cxo-postgres-prod
    environment:
      POSTGRES_DB: cxo_assistant
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: cxo-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

Start services:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

### 1. Create Namespace

```bash
kubectl create namespace cxo-assistant
kubectl config set-context --current --namespace=cxo-assistant
```

### 2. Create Secrets

```bash
# Create database secret
kubectl create secret generic db-credentials \
  --from-literal=username=cxo_user \
  --from-literal=password=your-db-password

# Create API keys secret
kubectl create secret generic api-keys \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=google-client-id=your-google-client-id \
  --from-literal=google-client-secret=your-google-client-secret \
  --from-literal=sendgrid-api-key=your-sendgrid-api-key \
  --from-literal=openai-api-key=your-openai-api-key
```

### 3. Deploy PostgreSQL (if not using managed service)

```yaml
# infrastructure/kubernetes/postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: cxo_assistant
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
```

### 4. Deploy Backend

```yaml
# infrastructure/kubernetes/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/cxo-assistant-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          value: "postgresql://$(DB_USER):$(DB_PASSWORD)@postgres:5432/cxo_assistant"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 5. Deploy Web Frontend

```yaml
# infrastructure/kubernetes/web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: your-registry/cxo-assistant-web:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 6. Create Services

```yaml
# infrastructure/kubernetes/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

### 7. Deploy Ingress (with SSL)

```yaml
# infrastructure/kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cxo-assistant-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - app.yourcompany.ai
    - api.yourcompany.ai
    secretName: cxo-assistant-tls
  rules:
  - host: app.yourcompany.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port:
              number: 80
  - host: api.yourcompany.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 3000
```

### 8. Apply Kubernetes Configurations

```bash
kubectl apply -f infrastructure/kubernetes/postgres-deployment.yaml
kubectl apply -f infrastructure/kubernetes/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/web-deployment.yaml
kubectl apply -f infrastructure/kubernetes/services.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

## SSL/TLS Configuration

### Using Let's Encrypt with Cert-Manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourcompany.ai
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Monitoring Setup

### Prometheus & Grafana

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80
# Default credentials: admin / prom-operator
```

## Backup Strategy

### Database Backups

```bash
# Daily backup cron job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - pg_dump \$DATABASE_URL | gzip > /backups/backup-\$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: DATABASE_URL
              value: "postgresql://user:pass@postgres:5432/cxo_assistant"
            volumeMounts:
            - name: backup-storage
              mountPath: /backups
          restartPolicy: OnFailure
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
EOF
```

## Health Checks

```bash
# Backend health
curl https://api.yourcompany.ai/health

# Check pods
kubectl get pods

# Check logs
kubectl logs -f deployment/backend
kubectl logs -f deployment/web
```

## Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5

# Autoscaling
kubectl autoscale deployment backend --cpu-percent=70 --min=3 --max=10
```

## Troubleshooting

### Common Issues

1. **Pod not starting**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

2. **Database connection issues**
```bash
kubectl exec -it <backend-pod> -- env | grep DATABASE
```

3. **SSL certificate issues**
```bash
kubectl describe certificate cxo-assistant-tls
kubectl describe certificaterequest
```

## Rollback

```bash
# View deployment history
kubectl rollout history deployment/backend

# Rollback to previous version
kubectl rollout undo deployment/backend

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2
```

---

For more support, contact DevOps team or refer to the main README.md
