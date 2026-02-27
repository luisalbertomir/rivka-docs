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

## 6. Sincronizar el Almacén Vectorial

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