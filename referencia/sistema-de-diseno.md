# Sistema de diseño — Kit de la Repostera

Esta es la especificación del estilo visual aprobado por Hector. Todos los valores salen de los
archivos de referencia `referencia-*.html` que acompañan a este documento.

**Regla general: nada de valores sueltos en los componentes.** Todo color, tamaño de letra,
espaciado, radio y sombra se define una vez aquí y se usa por su nombre. Si un componente necesita
un color que no está en esta lista, es señal de que falta definirlo acá, no de inventarlo ahí.

---

## Color

### Superficies y texto

| Token | Valor | Uso |
|---|---|---|
| `fondo` | `#F7F3ED` | Fondo de la aplicación |
| `superficie` | `#FFFDFA` | Tarjetas, menú lateral, barras |
| `superficie-2` | `#FCFAF7` | Campos de formulario, filas secundarias |
| `linea` | `#E7DDD2` | Bordes de tarjetas y separadores |
| `linea-suave` | `#EFE7DE` | Separadores entre filas de tabla |
| `tinta` | `#2E2621` | Texto principal |
| `tinta-media` | `#5C4E45` | Texto secundario, etiquetas de formulario |
| `tinta-suave` | `#6E6058` | Texto de apoyo, descripciones |
| `tinta-tenue` | `#8A7A6E` | Antetítulos, iconos decorativos |

### Marca

| Token | Valor | Uso |
|---|---|---|
| `vino` | `#8E3A58` | Color principal: botones, elemento activo del menú, acentos |
| `vino-oscuro` | `#6F2B43` | Texto sobre fondo `vino-suave`, hover del botón principal |
| `vino-suave` | `#F6E9EE` | Fondo de pastillas y destacados |
| `vino-borde` | `#E0C8D1` | Borde de tarjetas destacadas y botones secundarios de marca |
| `rosa-aviso` | `#FBF1F4` / borde `#EAD7DC` | Fondo de los "Tip de Eli" |
| `oro` | `#7C6124` sobre `#F8F0DF` | Bloque de suscripción |
| `verde` | `#4C5A48` sobre `#E9EFE7` | Insignias de estado correcto |
| `usuaria` | `#6F5A7E` | Avatar de la repostera con sesión iniciada |
| `eli` | `linear-gradient(135deg,#DFB2B8,#A75D77)` | Avatar de Eli Cifu (solo en el pie del menú) |

**Importante:** el avatar de arriba a la derecha es siempre la **repostera que tiene la sesión
iniciada** (token `usuaria`). Eli Cifu aparece únicamente abajo en el menú lateral, como creadora
del producto. Son dos personas distintas y por eso llevan colores distintos.

### Colores de gráfico

Validados para daltonismo y contraste. **No los cambies sin volver a validar.**

| Token | Valor | Uso |
|---|---|---|
| `grafico-1` | `#8E3A58` | Serie principal (margen, lo que le queda) |
| `grafico-2` | `#B2743C` | Serie secundaria (costos) |
| `grafico-pista` | `#EFE7DC` | Fondo de las barras |

---

## Tipografía

Dos familias, desde Google Fonts:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600&display=swap">
```

- **Playfair Display** (serif): títulos de página, cifras grandes de indicadores, nombre de marca,
  y el "Tip de Eli" en cursiva. Nunca para texto corrido ni para botones.
- **DM Sans**: absolutamente todo lo demás.

| Uso | Familia | Tamaño | Peso |
|---|---|---|---|
| Título de página (h1) | Playfair | 42px escritorio / 31px celular | 600, `letter-spacing: -.025em` |
| Cifra de indicador | Playfair | 30px (26px si el texto es largo) | 600 |
| Antetítulo | DM Sans | 11px, mayúsculas, `letter-spacing: .12em` | 700, color `vino` |
| Título de panel (h2) | DM Sans | 17px | 700 |
| Título de panel lateral (h3) | DM Sans | 14px | 700 |
| Texto de apoyo | DM Sans | 12px, `line-height: 1.5` | 400 |
| Etiqueta de indicador | DM Sans | 10.5px, mayúsculas, `letter-spacing: .1em` | 700 |
| Etiqueta de formulario | DM Sans | 11.5px | 600 |
| Fila de tabla | DM Sans | 13.5px nombre / 12.5px datos | 700 / 400 |
| Botón | DM Sans | 12.5px | 700 |

**Cifras siempre con `font-variant-numeric: tabular-nums`** (clase `.num`), para que los montos
queden alineados en columna y se puedan comparar de un vistazo.

---

## Forma y profundidad

| Elemento | Radio | Sombra |
|---|---|---|
| Panel grande | 20px | `0 18px 45px rgba(66,42,28,.08)` |
| Tarjeta de indicador | 18px | `0 8px 28px rgba(66,42,28,.035)` |
| Tarjeta chica / fila | 12–15px | ninguna, o `0 6px 18px rgba(66,42,28,.04)` en celular |
| Campo de formulario | 11px | ninguna |
| Botón | 11px | `0 9px 18px rgba(142,58,88,.20)` solo el principal |
| Menú: elemento activo | 12px | `0 8px 18px rgba(142,58,88,.20)` |
| Pastilla / insignia | 8px, o 999px si es una píldora | ninguna |

Campo con foco: `border-color: #BD8197` y `box-shadow: 0 0 0 3px rgba(142,58,88,.08)`.

---

## Iconos

**Un solo sistema: SVG de trazo, `stroke-width` 1.7–1.8, `stroke-linecap="round"`.**
Tamaños: 18px en el menú, 16–17px en botones, 14–15px en celular.

**Ningún emoji como icono de interfaz.** Los emoji se quedan solo dentro de los textos de Eli,
donde aportan calidez. Un emoji se dibuja distinto en cada teléfono, no se puede colorear ni
alinear, y es lo que más delata un diseño improvisado.

Todo botón que solo tenga icono lleva `aria-label`.

---

## Estructura de pantalla

### Escritorio (≥1080px)

Rejilla de dos columnas: `250px` de menú lateral + el resto de contenido.

**Menú lateral** (`superficie`, borde derecho `linea`, `padding: 26px 18px 20px`), de arriba abajo:
1. Marca: cuadrado `vino` de 42px con el icono, nombre en Playfair 20px, "CIFU PASTICCERIA" abajo
   en 10.5px mayúsculas.
2. Rótulo "HERRAMIENTAS" en 10px mayúsculas, color `tinta-tenue`.
3. Los enlaces de sección: 11px de alto, radio 12px, icono 18px + texto 13.5px. El activo va con
   fondo `vino`, texto blanco y sombra.
4. Abajo del todo, separado por una línea: el bloque de suscripción (fondo `oro`) y la ficha de
   Eli Cifu con su avatar.

**Área de contenido** (`padding: 34px 42px 0`), de arriba abajo:
1. Encabezado: antetítulo, `h1`, párrafo de introducción; a la derecha el botón de ayuda y la
   ficha de la usuaria.
2. Lo que corresponda a esa pantalla.

Separación vertical entre secciones: `20–22px`.

### Celular (<780px)

- El menú lateral **desaparece** y se reemplaza por: barra superior compacta (marca + avatar de la
  usuaria) y debajo un carril de navegación **deslizable en horizontal** con las secciones, la
  activa como píldora `vino`. Nunca partir la navegación en dos filas.
- Todo a una columna. `padding` lateral 16px.
- Las **tablas se convierten en tarjetas**: cada fila pasa a ser una tarjeta con el nombre arriba,
  los datos abajo en una línea, y el valor destacado a la derecha. No hay scroll horizontal.
- Los formularios largos se reemplazan por un botón principal ancho que los abre.
- Toda zona tocable mide al menos 44px.

---

## Componentes que hay que crear una sola vez

Estos se usan en todas las pantallas. Créalos como componentes reutilizables en
`src/components/ui/`, no los copies pantalla por pantalla:

| Componente | Qué resuelve |
|---|---|
| `Layout` | El armazón: menú lateral + área de contenido, y su versión de celular |
| `EncabezadoPagina` | Antetítulo + título + introducción + acciones de la derecha |
| `Panel` | Tarjeta grande con título, subtítulo y contenido |
| `TarjetaIndicador` | Etiqueta + cifra grande + nota al pie; variante destacada con borde `vino-borde` |
| `Campo` | Etiqueta + input/select, con sus estados de foco |
| `Boton` | Variantes principal, secundario y de solo icono |
| `Pastilla` | Las insignias de costo, estado y cantidad |
| `FilaTabla` | Fila que en escritorio es rejilla y en celular es tarjeta |
| `TipDeEli` | El bloque rosado con la cursiva de Playfair |
| `BarraProgreso` | La barra horizontal de los rankings |
| `SelectorPeriodo` | La barra de período del tablero |

---

## Accesibilidad — no es opcional

- Todo control es un `<button>`, `<a href>` o `<input>` real con su `<label>`. **Nunca un `<div>`
  con un clic encima**: el teclado no lo alcanza y un lector de pantalla no lo anuncia.
- Contraste mínimo 4.5:1 para texto. Los colores de esta paleta ya lo cumplen; si inventas uno
  nuevo, verifícalo.
- El elemento activo del menú lleva `aria-current="page"`.
- Los campos de búsqueda llevan `<label>` oculto visualmente, no solo `placeholder`.
