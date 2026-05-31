# Nice Clean

Web app para Nice Clean Servicios de Limpieza en Rohrmoser, Pavas y San Jose.

## Deploy en Vercel

Si, esta app puede publicarse en Vercel como proyecto Vite.

1. Importa el repositorio `ApoloSolInvictus/niceclean` en Vercel.
2. Usa `npm install` como Install Command.
3. Usa `npm run build` como Build Command.
4. Usa `dist` como Output Directory.
5. Agrega estas variables en Project Settings > Environment Variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_OWNER_EMAIL=ronnywoods77@gmail.com
```

Despues del primer deploy, agrega el dominio de Vercel en Firebase Authentication > Settings > Authorized domains. Ejemplos: `niceclean.vercel.app` y cualquier dominio propio que conectes.

## Configuracion Firebase

1. Crea un proyecto gratis en Firebase.
2. Activa Authentication con Email/Password.
3. Crea Firestore Database.
4. Activa Firebase Storage para subir CV.
5. Copia `.env.example` como `.env` y pega la configuracion web de Firebase.
6. Publica `firestore.rules` y `storage.rules` en Firebase. Si cambias el correo dueno, actualizalo tambien dentro de esas reglas.

```bash
npm install
npm run dev
```

El correo dueno por defecto es `ronnywoods77@gmail.com`. Puedes cambiarlo con `VITE_OWNER_EMAIL`.

## Colecciones

- `serviceRequests`: pedidos del sitio publico con direccion, Waze, entrada e instrucciones.
- `jobs`: trabajos publicados por Rocio para que las colaboradoras los tomen.
- `cleaners`: perfiles de colaboradoras, datos personales y enlace al CV subido a Storage.
