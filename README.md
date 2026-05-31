# Nice Clean

Web app para Nice Clean Servicios de Limpieza en Rohrmoser, Pavas y San Jose.

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

El correo dueño por defecto es `ronnywoods77@gmail.com`. Puedes cambiarlo con `VITE_OWNER_EMAIL`.

## Colecciones

- `serviceRequests`: pedidos del sitio publico con direccion, Waze, entrada e instrucciones.
- `jobs`: trabajos publicados por Rocio para que las colaboradoras los tomen.
- `cleaners`: perfiles de colaboradoras, datos personales y enlace al CV subido a Storage.
