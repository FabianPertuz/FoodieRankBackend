 # 🍔 FoodieRank Backend

FoodieRank es una API RESTful desarrollada con **Node.js**, **Express** y **MongoDB**.  
Su propósito es gestionar usuarios, restaurantes, platos y reseñas, con autenticación JWT y control de roles.

---

## 🚀 Tecnologías utilizadas

- **Node.js** + **Express.js**
- **MongoDB** (Driver oficial)
- **Passport.js** (JWT Strategy)
- **dotenv** para variables de entorno
- **bcrypt** para encriptación de contraseñas
- **Swagger** para documentación
- **Conventional Commits** para control de versiones
- **Git & GitHub** para control de código

---

## 🧱 Estructura del proyecto

```
src/
 ├── config/
 │    └── passport.js
 ├── controllers/
 │    ├── auth.controller.js
 │    ├── categories.controller.js
 │    ├── dishes.controller.js
 │    ├── restaurants.controller.js
 │    ├── reviews.controller.js
 │    └── users.controller.js
 ├── db/
 │    └── mongo.client.js
 ├── docs/
 │    └── swagger.js
 ├── middlewares/
 │    ├── auth.middleware.js
 │    ├── error.middleware.js
 │    └── validator.middleware.js
 ├── routes/
 │    ├── auth.routes.js
 │    ├── categories.routes.js
 │    ├── dishes.routes.js
 │    ├── restaurants.routes.js
 │    ├── reviews.routes.js
 │    └── users.routes.js
 ├── seed/
 │    └── seed.js
 ├── services/
 │    └── auth.service.js
 ├── utils/
 │    └── app.js
 ├── .env
 ├── .gitignore
 ├── package.json
 └── package-lock.json
```

---

## ⚙️ Instalación y configuración

1. Clona el repositorio:

```bash
git clone https://github.com/FabianPertuz/FoodieRankBackend.git
cd FoodieRankBackend
```

2. Instala las dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz con el siguiente contenido:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/foodierank
JWT_SECRET=supersecreto
```

4. Inicia el servidor:

```bash
npm start
```

---

## 🧠 Endpoints principales

| Módulo | Método | Endpoint | Descripción |
|--------|---------|-----------|--------------|
| **Auth** | `POST` | `/api/v1/auth/register` | Registrar nuevo usuario (solo rol `user`) |
|  | `POST` | `/api/v1/auth/login` | Iniciar sesión y obtener token JWT |
|  | `GET` | `/api/v1/auth/me` | Obtener datos del usuario logueado |
| **Usuarios** | `GET` | `/api/v1/users` | Listar usuarios (solo admin) |
| **Restaurantes** | `GET` | `/api/v1/restaurants` | Listar restaurantes |
|  | `POST` | `/api/v1/restaurants` | Crear restaurante (solo admin) |
| **Platos** | `GET` | `/api/v1/dishes` | Listar platos |
|  | `POST` | `/api/v1/dishes` | Crear plato (solo admin) |
| **Reseñas** | `GET` | `/api/v1/reviews` | Listar reseñas |
|  | `POST` | `/api/v1/reviews` | Crear reseña (usuario autenticado) |
|  | `DELETE` | `/api/v1/reviews/:id` | Eliminar reseña (admin o autor) |

---

## 🔐 Roles y autenticación

- `user`: puede registrarse, loguearse y crear reseñas.
- `admin`: debe ser creado manualmente desde la semilla (`seed.js`).  
  Tiene control total sobre usuarios, restaurantes, platos y reseñas.

---

## 🌱 Seed de datos

Ejecuta este comando para poblar la base de datos inicial:

```bash
node src/seed/seed.js
```

Esto crea:
- 1 administrador (`admin@foodierank.com` / `admin123`)
- 1 usuario (`carlos@foodierank.com` / `user123`)
- Restaurantes y platos de ejemplo

---

## 📘 Documentación Swagger

Una vez corras el servidor, entra a:

👉 `http://localhost:4000/api-docs`

Allí podrás probar todos los endpoints de la API.

---
## 📽️ Video explicativo y sprints

Video explicativo sobre backend y frontend: www.youtube.com/watch?v=jRt2IF9iNX4&feature=youtu.be

Sprints: www.youtube.com/watch?v=MyanitrV8jY&feature=youtu.be

## 🧭 Autor

**Carlos Mario Villamizar Medina & Fabian Camilo Pertuz Torres🍽️**  
Proyecto académico de backend con autenticación, control de roles y arquitectura modular.

---
## Frontend

https://github.com/FabianPertuz/FoodieRankFrontend

## Documentacion

https://www.notion.so/299fa9bc6872801f870dd3feffae1ff6?v=299fa9bc6872806fb811000cb22caadf


© 2025 FoodieRank - Todos los derechos reservados.
