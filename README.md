Proyecto de Salud Total de:

Pasos para tener tu sistema propio :D

1) Navegar hasta la terminal del back e instalar dependencias del package.json
  (npm install bcrypt cors dotenv express firebase-admin jsonwebtoken mysql2 socket.io)

2) Tener mysql con la DB en un comando de prompt unico que esta ubicado en el front "db.text"

3) crear un archivo ".env" en la carpeta de backend

  -controllers
  -middleware
  -models
  -node_modules
  -permissions
  -routes
  index.js
  .env

y debe tener este texto que debe ser rellenado por tus datos

PORT=

DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

FIREBASE_CREDENTIALS=
FIREBASE_DATABASE_URL=

4) Descargar la llave y ubicarla en la carpeta "permissions" con el nombre "clave-firebase.json

5) Abrir una terminal nueva y navegar al "frontend" y colocar lo siguiente

npm create vite@latest frontend

Project name: ... frontend
Select a framework: » React
Select a variant: » JavaScript

6) Luego de instalar el frame, instalamos dependencias "npm install" y "axios jwt-decode leaflet react-router-dom react-leaflet socket.io-client"

7) Crear un archivo en la carpeta raiz llamada .env

  -node_modules
  -public
  -src
  .env

Con este contenido que debe ser rellenado por el IPv4 de la red

VITE_API_URL=http://192.168.x.xxx:3001

   
8) Para iniciar el sistema, desde el back usar "node index.js" y en otra terminal desde el front usar "npm run dev"

Y LISTO A DISFRUTAR :D
   
