
MANUAL DE INSTALACIÓN – SALUD TOTAL

Backend + Frontend + Base de Datos + Firebase + Cloud Functions

1-----REQUISITOS PREVIOS

Instalar:

Node.js 20+
https://nodejs.org/
MySQL 8 (Workbench o consola)
https://dev.mysql.com/downloads/
Git
https://git-scm.com/
Firebase CLI
npm install -g firebase-tools


2-------DESCARGAR EL PROYECTO

La estructura debe quedar así:

SALUD-TOTAL/
── backend/
── frontend/
── functions/
── firebase.json
── .firebaserc

3-------INSTALACIÓN DEL BACKEND

Paso 1 — Ir a la carpeta backend:
cd backend

Paso 2 — Instalar dependencias:
npm install

Esto instalará: express, mysql2, cors, jsonwebtoken, bcrypt, firebase-admin, socket.io, dotenv, etc.

4------CREAR LA BASE DE DATOS (MySQL)

Paso 1 — Abrir MySQL Workbench o consola.

Paso 2 — Ejecutar archivo BaseCodigo.txt:
mysql -u root -p < db.txt

Este archivo:

Crea la base de datos salud_total

Crea tablas y relaciones

Inserta usuario inicial:
email: superadmin@saludtotal.com
contraseña: admin123 (ya hasheada)

5-------CREAR .env DEL BACKEND

Crear archivo:
backend/.env

Contenido:

PORT=3001

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=salud_total

JWT_SECRET=CAMBIAR_ESTE_VALOR

FIREBASE_CREDENTIALS=./permissions/clave-firebase.json
FIREBASE_DATABASE_URL=CAMBIAR_ESTE_URL

6-------AGREGAR LLAVE FIREBASE

Ir a Firebase → Configuración del proyecto → Cuentas de servicio
Descargar clave privada JSON.

Crear carpeta:
backend/permissions/

Renombrar la clave a:
clave-firebase.json

7-------INICIAR EL BACKEND

npm run dev
ó
node index.js

Si funciona verás:
Servidor en puerto 3001
Conectado a MySQL
Conectado a Firebase

8------ INSTALACIÓN DEL FRONTEND

Paso 1 — Ir a la carpeta frontend:
cd frontend

Paso 2 — Instalar dependencias:
npm install

9------CREAR .env DEL FRONTEND

Crear archivo:
frontend/.env

ipconfig -> IPv4 Address

Contenido:
VITE_API_URL=http://TU-IP:3001

10 ------INICIAR EL FRONTEND

npm run dev

Aparecerá algo como:
Local: http://localhost:5173

11 ------- INSTALAR CLOUD FUNCTIONS

Paso 1 — Ir a la carpeta functions:
cd functions

Paso 2 — Instalar dependencias:
npm install

Esto instalará automáticamente las siguientes librerías (definidas en functions/package.json):

firebase-functions
firebase-admin
axios
dotenv
nodemailer

Asegúrate de que el archivo functions/package.json contenga también:

"engines": {
  "node": "20"
}

Si no aparece, agregarlo manualmente.

12 ------ CONFIGURAR EL RUNTIME (OBLIGATORIO)

Editar functions/package.json y agregar:

"engines": {
"node": "20"
}

13 ------- VERIFICAR CONEXIÓN A FIREBASE

firebase login
firebase projects:list

14 ------ DEPLOY DE CLOUD FUNCTIONS

Subir solo las funciones:
firebase deploy --only functions

15 ------ VERIFICAR FUNCIONES EN PRODUCCIÓN

En Firebase Console → Functions deben aparecer:

auditoria-auditarTurno
correos-correoAltaUsuario
correos-enviarCorreo
turnos-recordatorio24h


16 ----- TESTEO GENERAL DEL SISTEMA

 Crear usuario
 Login
 Crear turno
 Confirmar turno
 Chat con admin
 Ver mapa Leaflet
 Probar correos de alta
 Probar recordatorio 24h
 Probar auditoría del médico


FIN DEL MANUAL



