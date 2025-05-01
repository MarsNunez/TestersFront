# ProyectoInventarioF2 - Frontend

Este es el frontend del sistema de **Control de Inventario**, desarrollado con **Next.js** y **Tailwind CSS**. Permite al usuario gestionar productos conectándose al backend vía API REST.

---

## 🚀 Pasos para comenzar

### 1. Clonar el repositorio

```bash
git clone https://github.com/MarsNunez/gerraTestersFront.git
cd gerraTestersFront
```

---

### 2. Instalar dependencias

Una vez dentro del proyecto, instala todas las dependencias necesarias ejecutando:

```bash
npm install
```

---

### 3. Ejecutar el servidor de desarrollo

Para correr el servidor en modo desarrollo, ejecuta:

```bash
npm run dev
```

El frontend estará disponible normalmente en:

```
http://localhost:3000
```

---

### ⚠️ Requisitos previos

Antes de ejecutar el frontend, asegúrate de que:

- La **base de datos PostgreSQL** esté levantada y contenga los datos requeridos.
- El **servidor backend** (Spring Boot) esté corriendo correctamente en `http://localhost:8081`.

Esto es necesario para evitar errores al realizar solicitudes `fetch` desde el frontend hacia la API.

---
