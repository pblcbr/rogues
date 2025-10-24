# Configuración de Stripe CLI para Webhooks Locales

## Paso 1: Autenticar Stripe CLI

En una terminal, ejecuta:

```bash
stripe login
```

Esto abrirá el navegador para autorizar el acceso. Acepta la conexión.

## Paso 2: Escuchar eventos de Stripe

Ejecuta este comando (déjalo corriendo en una terminal):

```bash
stripe listen --forward-to http://localhost:3003/api/stripe/webhook
```

**¡IMPORTANTE!** Este comando te dará un **webhook signing secret** que empieza con `whsec_...`

Ejemplo:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

## Paso 3: Agregar el secret a .env.local

Copia el secret que te dio Stripe CLI y agrégalo a tu `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
```

## Paso 4: Reiniciar el servidor de desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

## Paso 5: Probar el flujo completo

1. Registra un nuevo usuario
2. Completa los pasos hasta Pricing
3. Selecciona un plan
4. Usa la tarjeta de prueba de Stripe:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
   - ZIP: Cualquier código postal

5. En la terminal donde está corriendo `stripe listen`, verás:

```
✓ checkout.session.completed [evt_1234...]
✓ customer.subscription.created [evt_5678...]
```

6. En tu servidor de desarrollo, verás logs:

```
[STRIPE WEBHOOK] Received event
[STRIPE WEBHOOK] Event type: checkout.session.completed
[STRIPE WEBHOOK] ✓ Workspace created
[STRIPE WEBHOOK] ✅ Checkout completed successfully
```

7. El usuario ahora podrá acceder al dashboard!

## Comandos útiles

### Listar eventos recientes

```bash
stripe events list
```

### Reenviar un evento específico (para testing)

```bash
stripe events resend evt_1234567890
```

### Probar un evento sin hacer checkout

```bash
stripe trigger checkout.session.completed
```

## Para producción

Cuando despliegues a producción:

1. Ve a Stripe Dashboard > Developers > Webhooks
2. Crea un nuevo webhook con tu URL de producción:
   ```
   https://tupagina.com/api/stripe/webhook
   ```
3. Selecciona los mismos eventos
4. Copia el webhook secret de producción
5. Agrégalo a tus variables de entorno de producción

## Troubleshooting

### Error: "No signature found"

- Asegúrate de que `stripe listen` está corriendo
- Verifica que la URL en `stripe listen` coincida con tu puerto

### Error: "Invalid signature"

- Verifica que `STRIPE_WEBHOOK_SECRET` en `.env.local` es correcto
- Reinicia el servidor después de cambiar `.env.local`

### No se crea el workspace

- Revisa los logs del webhook en la consola
- Verifica que el usuario existe en la base de datos
- Chequea que `client_reference_id` o `metadata.userId` están presentes

---

**Última actualización**: Octubre 24, 2025
