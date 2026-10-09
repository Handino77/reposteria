# Kit de la Repostera — instrucciones del proyecto

Aplicación para reposteras chilenas: manejan despensa, recetas, costos, pedidos y suscripción.
React + Vite + Tailwind, con Supabase (base de datos, autenticación y Edge Functions en Deno) y
Flow.cl para el cobro mensual de $3.000 CLP.

El dueño del producto es Hector. Las decisiones de diseño y de producto las toma él; las
especificaciones llegan como documentos de encargo.

---

## Esquema real de la base de datos

**Úsalo. No adivines nombres de columnas.** El error más caro de este proyecto fue código escrito
contra campos que no existían (`rendimiento` en vez de `rinde`, `ingredientes` en vez de la tabla
`receta_ingredientes`), que pasó 15 pruebas estando roto.

| Tabla | Columnas |
|---|---|
| `reposteras` | `id` (= auth user id), `nombre_contacto`, `nombre_negocio`, `estado_suscripcion` ('pendiente'/'activa'/'cancelada'), `flow_customer_id`, `flow_subscription_id`, `flow_register_token`, `fecha_proximo_cobro` |
| `despensa` | `repostera_id`, `nombre`, `cantidad`, `precio`, `costo_base`, `unidad_base`, `unidad_compra`, `creado_en` |
| `recetas` | `id`, `repostera_id`, `nombre`, **`rinde`**, `creado_en` |
| `receta_ingredientes` | `receta_id`, `despensa_id`, `nombre`, **`cantidad`**, `unidad`, `orden` |
| `pedidos` | `id`, `repostera_id`, `fecha`, `cliente`, `estado` ('pendiente'/'listo'/'entregado'), `estado_pago_cliente` ('no_pagado'/'abonado'/'pagado'), `total` |
| `pedido_items` | `pedido_id`, **`receta_id`**, `producto`, `cantidad`, `precio_unitario`, `orden` |
| `pagos_suscripcion` | `repostera_id`, `flow_token`, `flow_charge_id`, `monto`, `estado`, `creado_en` |

Los ingredientes de una receta se traen con join: `.select('*, receta_ingredientes (*)')`.
`pedido_items.receta_id` enlaza el producto pedido con su receta — úsalo antes que comparar nombres.

## Ayudantes que ya existen

`src/utils/conversores.js`: `densidadTazas`, `obtenerDensidad`, `factorBase`, `unidadBaseDe`,
`convertirACantidadBase`, `normalizarTextoFlex`, `CLP`. **Reutilízalos, no escribas versiones
nuevas.** Las tablas de conversión viven en `src/utils/tablasConversion.js`.

---

## Trampas conocidas de este proyecto

- **Flow devuelve `status` como texto** (`"1"`), no como número. `status === 1` da falso. Usa
  `Number(...)`. Los estados de suscripción de Flow son `0` inactiva, `1` activa, `2` trial,
  `4` cancelada — no existe el `3`.
- **Fechas**: todo lo que vea la usuaria se calcula en `America/Santiago`. `toISOString()` trabaja
  en UTC y adelanta un día a partir de las 21:00. Si Flow entrega una fecha, úsala; no la calcules.
- **`Dashboard.jsx` lee `?tab=suscripcion` de la URL** para abrir la sección correcta cuando la
  repostera vuelve de pagar en Flow. De eso dependen los cobros. No lo rompas.
- Las Edge Functions `flow-webhook-suscripcion` y `flow-return-redirect` se despliegan con
  `--no-verify-jwt` porque Flow las llama sin sesión.

---

## Reglas de trabajo

### Alcance
Toca solo los archivos que el encargo nombra. No recorras el proyecto "por si acaso": hay archivos
de 50 KB y leerlos sin necesidad cuesta caro. No hagas mejoras que el encargo no pidió; si ves algo
mejorable, dilo en el reporte.

### Prohibido fallar en silencio
Todo bloque que busque algo y no lo encuentre debe avisar: un mensaje en pantalla para la usuaria o
un error explícito en la respuesta. Nunca un `if` sin `else` que simplemente no hace nada. Los tres
errores más caros del proyecto fueron silenciosos: un `catch` vacío, un `if (Array.isArray(...))`
sin salida, y una respuesta de éxito que en realidad decía "sin cambios".

### Verificación
- Si la función lee de Supabase, **la prueba lee de Supabase**. Una prueba que fabrica sus propios
  datos solo confirma la aritmética, no que la función sirva.
- **No crees scripts de prueba con datos inventados.** No sirvieron ni una vez.
- **No generes imágenes como evidencia de interfaz.** Si no puedes capturar la pantalla real, dilo
  y deja que Hector la tome.
- **No fuerces el resultado de una prueba** con sincronizaciones manuales. Si falla, falla: eso es
  información.
- `npm run build` sin errores no es verificación, es lo mínimo para entregar.

### Credenciales
Nunca escribas el valor de una API key, token o secreto en ningún mensaje, reporte o resumen, ni
enmascarado. Menciónalos solo por su nombre (`FLOW_API_KEY`, `SUPABASE_ACCESS_TOKEN`). Tampoco los
dejes en archivos del repositorio.

### Formato del reporte
Máximo **200 palabras**, sin repetir el código que escribiste:
1. Qué archivos cambiaste (rutas).
2. Qué hiciste, una línea por punto del encargo.
3. Qué falta verificar y quién debe hacerlo.
4. Lo que encontraste y el encargo no cubría.

Si algo no se pudo hacer, dilo explícitamente en vez de sustituirlo por otra cosa.

---

## Diseño

El sistema visual está en `referencia/sistema-de-diseno.md`, con pantallas de ejemplo en
`referencia/referencia-*.html`. Colores, tipografías, radios y sombras se usan por su nombre desde
la configuración de Tailwind: nada de hexadecimales sueltos en los componentes.

Iconos: SVG de trazo, nunca emoji en la interfaz. Los emoji se quedan solo dentro de los textos de
Eli. Todo control es un `<button>`, `<a href>` o `<input>` real con su `<label>` — nunca un `<div>`
con un clic encima.
