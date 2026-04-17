Kubernetes starter manifests for local Docker Desktop images.

How to use:
1. Enable Kubernetes in Docker Desktop using the 'kind' option and wait until it is running.
2. Put this entire folder into your project as: k8s/
3. Run:
   kubectl apply -f k8s/
4. Check:
   kubectl get pods
   kubectl get services

Notes:
- These files use imagePullPolicy: Never, so Kubernetes will use your local desktop images.
- This set is for demonstrating Kubernetes deployment/orchestration.
- Database init.sql mounting from Docker Compose is not included here.
- API Gateway NodePort: 30000
- Frontend NodePort: 30001

kubectl config use-context docker-desktop
kubectl get nodes
