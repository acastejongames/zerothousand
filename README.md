# De cero a algo

**De cero a algo** es un juego idle/clicker 2D, autocontenido y en español. Empiezas en una plaza con una moneda y un oficio; con clics, comida, compras y generadores construyes una vida nueva y haces crecer el barrio hasta llegar a tu proyecto soñado. La escena está dibujada con Canvas y cambia con las etapas y los objetos que desbloqueas; no necesita sprites ni dependencias externas.

## Cómo jugar

- Haz clic en la escena o en el botón de oficio para ganar monedas.
- En **Mejoras**, compra acciones, objetos y mejoras de clic. En **Comida**, compra y prueba alimentos para recuperar energía y saciedad. Usa **Generadores** para obtener ingresos por segundo.
- La tarjeta **El siguiente paso** muestra el requisito actual. Los objetos bloqueados permanecen atenuados y explican qué necesitas.
- Recorre **Mapa** para ver las doce etapas; **Progreso** contiene habilidades, misiones, trabajos, mascotas y logros; **Sueños** contiene prestigio y finales.
- Cambia entre modo **Tranquilo** (sin drenaje de saciedad ni eventos negativos) y **Difícil** (hambre y más contratiempos). El alquiler periódico aparece al salir de la calle.
- Se guarda automáticamente en el almacenamiento local del navegador. Al volver, puedes cobrar progreso offline —hasta ocho horas, al 50 % del MPS—. **Nueva vida** se desbloquea al acumular 1 T en una partida.

## Las doce etapas

| Etapa | Desbloqueo por ingresos acumulados |
| --- | ---: |
| Calle | Inicio |
| Habitación alquilada | 3 k € + 10 comidas distintas + reputación 5 |
| Primera bici | 15 k € |
| Piso pequeño | 120 k € |
| Moto y furgoneta | 1 M € |
| Puesto propio | 8 M € |
| Tienda de barrio | 60 M € |
| Local con equipo | 500 M € |
| Casa con jardín | 5 B € |
| Cadena regional | 50 B € |
| Empresa nacional | 1 T € |
| Proyecto soñado | 50 T € |

Los generadores producen MPS y cada unidad comprada aumenta el coste de la siguiente un 15 %. Las mejoras de generador duplican su producción al alcanzar los hitos indicados en el catálogo. La reputación, la comodidad y el árbol de Sueños modifican la progresión.

## Ejecutar

Abre `index.html` directamente o sirve la carpeta con cualquier servidor estático. Por ejemplo:

```sh
python3 -m http.server 8000
```

No se requieren paquetes, conexión de juego ni recursos externos. El estado de partida y la preferencia de sonido se guardan en el navegador.
