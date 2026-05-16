# eg-auth-service

Microservicio dedicado a autenticacion, generacion de JWT y validacion RBAC.

## Endpoints

- `GET /api/auth/health`: healthcheck del servicio.
- `POST /api/auth/login`: genera un JWT.
- `GET /api/auth/me`: valida el JWT y devuelve el perfil del usuario.
- `GET /api/auth/admin-check`: valida JWT y rol `admin`.

## Login de desarrollo

El init script de `eg-auth-db` crea un administrador inicial:

- Email: `admin@energygrid.local`
- Password: `Admin123!`
- Rol: `admin`

Cambiar estas credenciales antes de usar el stack fuera de desarrollo.

## Ejemplo

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@energygrid.local\",\"password\":\"Admin123!\"}"
```

Luego enviar el token:

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```
