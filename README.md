# GONFIXIT Forms · forms.gonfixit.com

Cuestionarios de GONFIXIT (diagnóstico y los que vengan) con la estética de la marca: una pregunta por
pantalla, consentimiento RGPD antes de empezar, resumen editable y envío al CRM.

Sitio estático: no necesita servidor. Producción en Hostinger (forms.gonfixit.com) con despliegue automático desde la rama main; preview en GitHub Pages.
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
```

## Enlaces

| Qué | URL |
|---|---|
| Diagnóstico general | `https://forms.gonfixit.com/?f=diagnostico` |
| Personalizado para un cliente | `https://forms.gonfixit.com/?f=diagnostico&c=flores-elena` |
| Prueba sin enviar al CRM | añade `&preview=1` |
| **Datos para el contrato (alta de cliente)** | `https://forms.gonfixit.com/?f=alta` · personalizado: `&c=puro-cakes` |

**Alta de cliente (`forms/alta.json`).** Lo rellena el cliente cuando ya ha aceptado el presupuesto, antes del contrato: empresa o autónomo, razón social, NIF/CIF, domicilio fiscal, quién firma (con su DNI), cómo paga (transferencia o domiciliación, con IBAN) y el email de facturación. Sin pre-diagnóstico. El servidor lo manda por correo a GONFIXIT y al CRM como `tipo: alta` (ficha del cliente lista para «Cerrar venta» y la página de firma salta el paso de datos). Funciona aunque Airtable no responda: el correo sale igual y el CRM lo guarda en cola. Para un cliente concreto, crea `clients/<slug>.json` con `"form": "alta"` (ejemplo: `puro-cakes.json`).

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

Producción: Hostinger, sitio forms.gonfixit.com con despliegue Git desde este repositorio (rama main, auto-deploy). Preview: GitHub Pages en gonfixit.github.io/gonfixit-forms.
El despliegue automático lo gestiona la app de GitHub conectada en hPanel (Avanzado → Git): cada push a main se publica solo, sin webhook manual.

## Desarrollo local

```
node serve.mjs
```
y abre `http://localhost:4174/?f=diagnostico&preview=1`.
