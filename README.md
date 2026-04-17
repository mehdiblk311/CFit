# CFit

Monorepo for the CFit platform:
- `Front-End/` — React + Vite client
- `Backend/` — Go API, workers, monitoring, coach UI, and RAG services

## Run the full stack

1. Copy `Backend/.env.example` to `Backend/.env` and fill the required secrets.
2. From the repository root, start everything with:

```bash
make run
```

Main endpoints:
- Front-End: http://localhost:5173
- API: http://localhost:8082
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

The root `Makefile` is the entrypoint for the full Docker Compose stack.
