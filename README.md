# GONFIXIT Forms · forms.gonfixit.com

Cuestionarios de GONFIXIT (diagnóstico y los que vengan) con la estética de la marca: una pregunta por
pantalla, consentimiento RGPD antes de empezar, resumen editable y envío al CRM.

Sitio estático: no necesita servidor. Se publica con GitHub Pages y se sirve en `forms.gonfixit.com`.
Las respuestas van a `https://gonfixit.com/api/forms` (servidor Express del repo `gonfixit-web`), que las
guarda en Airtable (base GONFIXIT CRM, tabla `leads`, estado «por revisar») y avisa por correo.

## Estructura

```
index.html            la app (una sola página)
assets/forms.css      estilos (papel, espresso, naranja · Archivo + IBM Plex Sans desde gonfixit.com)
assets/forms.js       motor: carga el JSON, pinta pantallas, valida, guarda borrador, envía
forms/<id>.json       definición de cada cuestionario (preguntas, consentimiento, textos)
clients/<id>.json     personalización por cliente: saludo, respuestas ya rellenas, preguntas que se saltan
PREGUNTAS.md          las preguntas del diagnóstico en texto, para revisarlas sin abrir el JSON
(CNAME se añade cuando el DNS de forms.gonfixit.com esté creado; hasta entonces el preview vive en gonfixit.github.io/gonfixit-forms/)
```

## Enlaces

| Qué | URL |
|---|---|
| Diagnóstico general | `https://forms.gonfixit.com/?f=diagnostico` |
| Personalizado para un cliente | `https://forms.gonfixit.com/?f=diagnostico&c=flores-elena` |
| Prueba sin enviar al CRM | añade `&preview=1` |

## Cómo se adapta a cada cliente

1. **Por sector, automático.** En `forms/diagnostico.json` hay preguntas con `showIf` que solo aparecen según el
   sector elegido (reparto en hostelería, citas caídas en estética, Booking en hoteles, encargos en floristerías…).
2. **Por cliente, con un archivo.** Crea `clients/<slug>.json` con `title`, `intro`, `preset` (respuestas ya
   rellenas) y `skip` (preguntas que no se muestran). El enlace lleva `&c=<slug>`.
3. **Un cuestionario nuevo.** Copia `forms/diagnostico.json`, cambia `id`, preguntas y textos. El servidor acepta
   cualquier formulario: vuelca todas las respuestas en la columna «Respuestas» y, las que coinciden con el
   diagnóstico, también en su columna.

Tipos de pregunta: `text`, `email`, `tel`, `textarea`, `single` (una opción), `multi` (varias).
Campos: `key`, `section`, `label`, `help`, `placeholder`, `required`, `min`, `max`, `options[{value,label}]`,
`showIf {key, in:[…]}`.

## Flujo comercial

Cada envío entra en el CRM con `RevisionComercial = por revisar`. El responsable comercial lo revisa, lo pasa a
`confirmado` (o `descartado`) y entonces se contacta al cliente. La columna `Formulario` dice de qué
cuestionario y cliente viene; `ConsentVersion` y `ConsentMarketing` guardan el consentimiento.

## Publicar

Cada push a `main` despliega en GitHub Pages. Para el dominio: en Hostinger (DNS de gonfixit.com) un registro
`CNAME` con nombre `forms` apuntando a `gonfixit.github.io`. GitHub emite el certificado HTTPS solo.

## Desarrollo local

```
node serve.mjs
```
y abre `http://localhost:4174/?f=diagnostico&preview=1`.
