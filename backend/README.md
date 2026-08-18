# API Ayouta

API REST Express/TypeScript. Voir le README racine pour l'installation.

Routes initiales :

- `GET /health`
- `POST /api/v1/auth/login`
- `GET|POST /api/v1/stores`
- `PATCH|DELETE /api/v1/stores/:id`
- `GET|POST /api/v1/shifts`
- `PATCH|DELETE /api/v1/shifts/:id`
- `POST /api/v1/shifts/:id/publish`
- `GET|POST /api/v1/employees`
- `PATCH|DELETE /api/v1/employees/:id`
- `GET|POST /api/v1/employees/:id/assignments`
- `GET /api/v1/attendances`
- `POST /api/v1/attendances/check-in|check-out|break`
- `PATCH /api/v1/attendances/:id/correct`
- `GET|POST /api/v1/requests`
- `PATCH /api/v1/requests/:id/review`
- `GET /api/v1/notifications`

Les routes métier sont protégées par JWT. Les écritures sensibles créent un journal d'audit et les publications/décisions génèrent des notifications.
