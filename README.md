# La Liga Hub ⚽

La Liga Hub is a premium, real-time football dashboard providing the latest news, standings, fixtures, and transfer updates from the Spanish top flight.

## 🚀 Production Deployment (Kubernetes)

This project is built for high-scale production using **Docker** and **Kubernetes**. It features a decoupled architecture with an Nginx-powered frontend and a Node.js backend.

### Prerequisites
- Docker & Docker Compose
- A Kubernetes cluster (minikube, Kind, or managed K8s like GKE/EKS)
- `kubectl` configured to your cluster

### 1. Configure Secrets
We use Kubernetes Secrets to manage sensitive API keys. 
1. Copy `k8s/secrets-example.yaml` to `k8s/secrets.yaml`.
2. Fill in your `FOOTBALL_API_KEY`, `EMAIL_USER`, and `EMAIL_PASS` (Brevo API key).
3. Apply the secret:
   ```bash
   kubectl apply -f k8s/secrets.yaml
   ```

### 2. Build and Push Images
Build the Docker images for both services:
```bash
# Backend
docker build -t your-registry/laliga-backend:latest ./backend
docker push your-registry/laliga-backend:latest

# Frontend
docker build -t your-registry/laliga-frontend:latest ./frontend
docker push your-registry/laliga-frontend:latest
```

### 3. Deploy to Kubernetes
Apply the configuration files in order:
```bash
# Create Namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml

# Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml

# Configure Ingress
kubectl apply -f k8s/ingress.yaml
```

### 4. Access the Application
The application will be available via the Ingress controller. By default, it is configured for `laliga.local`. You may need to add this to your `/etc/hosts`:
```text
127.0.0.1  laliga.local
```

## 🛠️ Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern Glassmorphism), JavaScript (ES6+)
- **Backend**: Node.js, Express, Axios, Nodemailer (Brevo API)
- **Infrastructure**: Nginx (Static Serving & Reverse Proxy), Docker, Kubernetes

## ✨ Features
- **Real-time Data**: Live feeds for standings, scorers, and news.
- **Stadium Mode**: Immersive matchday audio atmosphere.
- **Smart Subscription**: Newsletter with native browser matchday notifications.
- **Daily Match Alerts**: Automated 2 PM Barcelona-time fixture notifications.

---
Created by [Hamza](https://github.com/hamzax180)
