---
id: somar-setup
title: Instalación y Configuración
sidebar_position: 2
---

# Instalación y Configuración

Guía para levantar SOMAR App en un entorno de desarrollo local.

## Requisitos Previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| PHP | 8.2+ | Con extensiones `pdo`, `mbstring`, `openssl` |
| Composer | 2.x | Gestor de dependencias PHP |
| Node.js | 18+ | Para el frontend React |
| Python | 3.10+ | Para el script de pronósticos |
| SQLite | 3.x | BD local (o MySQL/PostgreSQL para prod) |
| ChromaDB | 0.4+ | Servidor vectorial en puerto 8000 |

---

## 1. Clonar el Repositorio
```bash
git clone https://github.com/Rivka-Interno/somar-app.git
cd somar-app
```

---

## 2. Configurar el Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edita `.env` con tus valores:
```env
GEMINI_API_KEY=AIza...
VECTORDB_HOST=http://localhost:8000
VECTORDB_COLLECTION=somar_rag
```

Ejecuta las migraciones:
```bash
php artisan migrate
php artisan db:seed
```

---

## 3. Configurar el Frontend (React)
```bash
cd frontend
npm install
npm run dev     # Inicia en http://localhost:5173
```

---

## 4. Configurar Python (Pronósticos)
```bash
cd backend/scripts
pip install -r requirements.txt
```

`requirements.txt`:
```text
prophet >= 1.1.5
pandas  >= 2.0.0
numpy   >= 1.24.0
```

---

## 5. Levantar ChromaDB
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

:::tip Verificar ChromaDB
Visita `http://localhost:8000/api/v2/heartbeat` — deberías ver `{"nanosecond heartbeat": ...}`.
:::

---

## 6. Levantar con Docker (Recomendado)

Si prefieres no instalar las dependencias manualmente, puedes usar Docker para levantar todo el entorno.

### Requisitos

- **Docker** 24.x+
- **Docker Compose** 2.x+

### Iniciar todos los servicios
```bash
docker compose up -d
```

Esto levanta automáticamente:

| Servicio | Puerto | Descripción |
|---|---|---|
| Laravel (backend) | `8000` | API principal |
| React (frontend) | `5173` | Interfaz de usuario |
| ChromaDB | `8001` | Almacén vectorial |

### Comandos útiles
```bash
# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Detener todos los servicios
docker compose down

# Reconstruir imágenes (tras cambios en dependencias)
docker compose up -d --build

# Ejecutar comandos dentro del contenedor de Laravel
docker compose exec backend php artisan migrate
docker compose exec backend php artisan somar:sync-vector-store
```

:::tip Primera vez
Al levantar por primera vez ejecuta las migraciones dentro del contenedor:
```bash
docker compose exec backend php artisan migrate --seed
```
:::

:::warning Puertos ocupados
Si el puerto `8000` ya está en uso en tu máquina, edita el `docker-compose.yml` y cambia `"8000:8000"` por ejemplo a `"8080:8000"`.
:::

## 7. Sincronizar el Almacén Vectorial

Una vez que ChromaDB esté corriendo, sincroniza los datos:
```bash
php artisan somar:sync-vector-store
```

---

## Verificación Final

| Servicio | URL | Estado esperado |
|---|---|---|
| Frontend | `http://localhost:5173` | Pantalla de login |
| Backend Laravel | `http://localhost:8000` | API respondiendo |
| ChromaDB | `http://localhost:8000/api/v2/heartbeat` | JSON con heartbeat |

:::warning Orden de inicio
Levanta ChromaDB **antes** de iniciar Laravel. De lo contrario el `DatabaseSyncService` fallará al intentar conectarse.
:::