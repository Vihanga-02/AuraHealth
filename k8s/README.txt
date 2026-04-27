Kubernetes starter manifests for local Docker Desktop images.

How to use:
1. Enable Kubernetes in Docker Desktop using the 'Kubeadm' option and wait until it is running.
2. Run:
   kubectl apply -f k8s/
3. Check:
   kubectl get pods
   kubectl get services

Notes:
- These files use imagePullPolicy: Never, so Kubernetes will use your local desktop images.
- API Gateway NodePort: 30000
- Frontend NodePort: 30001

