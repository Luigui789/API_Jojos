# Archivo de Stands - JoJo's Bizarre Adventure

Portal web que consume una API pública de Stands de *JoJo's Bizarre Adventure* para consultar fichas técnicas, usuarios, estadísticas de combate (Rango A - E), habilidades y catálogo filtrable.

## Estructura

- `index.html`: Interfaz de búsqueda de Stands y catálogo general.
- `css/styles.css`: Hojas de estilo con diseño oscuro sobrio.
- `js/app.js`: Consumo de la API, renderizado de tarjetas, filtros y manejo personalizado de errores de petición (`400`, `404`, `408`, `429`, `500`, `503` y error de red).
