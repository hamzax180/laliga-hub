# ☸️ Kubernetes Setup

The project is architected for containerized scale using Docker and Kubernetes.

## Infrastructure Components
- **Namespacing**: All resources are isolated in the `laliga` namespace.
- **Frontend Pods**: Powered by Nginx Alpine, serving static assets and proxying `/api` requests to the backend.
- **Backend Pods**: Node.js Alpine images running the Express server.
- **Secrets Management**: Sensitive API keys (Football Data, Brevo) are injected as Environment Variables via Kubernetes `Secrets`.

## Networking
- **Services**: `ClusterIP` for backend internal communication and `LoadBalancer` for external frontend access.
- **Ingress**: Configured to route traffic based on hostnames (e.g., `laliga.local`) with clean path routing.

## Local Testing
Deployment is streamlined via a unified `k8s/` directory and can be applied with:
```bash
kubectl apply -f k8s/
```
