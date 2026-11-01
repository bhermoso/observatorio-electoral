// Veda de publicación de sondeos (LOREG art. 69.7): los cinco días anteriores a la votación.
// Por prudencia se extiende hasta el cierre de los colegios el día de la votación (20:00 en la
// península). Durante ese intervalo la web no publica cifras del pronóstico ni de encuestas.
// Elecciones generales del 29-nov-2026; noviembre en Madrid = UTC+1.
export const VEDA = {inicio: new Date('2026-11-23T23:00:00Z'), fin: new Date('2026-11-29T19:00:00Z')};
export function enVeda(ahora = new Date(), veda = VEDA) {
  return ahora >= veda.inicio && ahora < veda.fin;
}
export const AVISO_VEDA = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pronóstico 29N</title>
<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#f6f7f9;color:#161a21}main{max-width:640px;margin:0 auto;padding:48px 16px}a{color:#34507a}@media(prefers-color-scheme:dark){body{background:#13161b;color:#e8ebf0}a{color:#9db6dc}}</style>
</head><body><main>
<h1>Pronóstico 29N: publicación suspendida</h1>
<p>El artículo 69.7 de la Ley Orgánica del Régimen Electoral General prohíbe publicar, difundir o reproducir sondeos electorales durante los cinco días anteriores a la votación. Desde el martes 24 de noviembre hasta el cierre de los colegios electorales el domingo 29 a las 20:00, esta página no muestra el pronóstico ni las encuestas en las que se basa.</p>
<p><a href="./">Volver al observatorio</a></p>
</main></body></html>
`;
