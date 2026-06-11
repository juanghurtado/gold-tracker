# Gold Tracker — Glosario del dominio

## Activo (Asset)
Una pieza física concreta de oro que el usuario ha comprado. Puede ser una moneda de curso legal (Krugerrand, Maple Leaf, American Eagle, etc.) o un lingote/barra. Cada activo es una unidad individual — si se compra otra pieza idéntica en otra fecha, es un activo distinto.

### Atributos de un activo
- **Tipo**: moneda o lingote
- **Nombre/designación**: ej. "Krugerrand 1 oz", "Maple Leaf 1/2 oz"
- **País de origen** (si aplica)
- **Año de acuñación** (si aplica)
- **Peso total**: peso bruto de la pieza
- **Unidad de peso**: onzas troy (oz t) o gramos (g)
- **Pureza**: quilates o porcentaje (ej. 24kt / 99.99%, 22kt / 91.67%)
- **Coste de adquisición**: precio total pagado en EUR (incluyendo gastos si se desea)
- **Fecha de compra**: día en que se adquirió
- **Estado**: siempre "en cartera". Si se vende, se elimina el activo (no hay tracking de vendidos).

### Cálculo del valor del oro
El valor actual del oro de un activo se calcula como:
`peso_total × pureza × precio_spot_eur_por_oz`
El usuario introduce peso total y pureza; la app calcula el peso fino automáticamente.

## Precio spot (Spot Price)
Precio del oro en tiempo real obtenido de una API externa (GoldAPI, Metals-API, o similar). Se obtiene automáticamente al consultar el estado de los activos. Se expresa en EUR previa conversión desde USD.

## Moneda base (Base Currency)
Moneda en la que el usuario expresa todos los valores. Para este proyecto: **EUR**. El precio spot del oro (XAU/USD) se convierte a EUR usando el tipo de cambio del día vía la misma API externa. El coste de compra de cada activo se registra en EUR.

## Persistencia (Persistence)
Los datos de los activos se almacenan exclusivamente en el navegador del usuario (localStorage/IndexedDB). Sin backend, sin servidor, sin base de datos externa.

## Stack técnico
- **Frontend**: React + Vite + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **API de precios**: metalpriceapi.com (oro XAU/USD + tipo de cambio EUR/USD)
- **Persistencia**: navegador (localStorage/IndexedDB)

## API key
La API key de metalpriceapi.com se guarda en localStorage. El usuario la introduce una vez en la configuración de la app.

## Actualización de precios
- Al cargar la app se solicita el precio automáticamente.
- Botón "Actualizar precios" para refresco manual.
- Sin polling automático.