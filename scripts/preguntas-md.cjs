/* Regenera PREGUNTAS.md a partir de forms/diagnostico.json. Uso: node scripts/preguntas-md.cjs */
const fs = require('fs');
const path = require('path');
const f = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'forms', 'diagnostico.json'), 'utf8'));
const label = (key, values) => {
  const q = f.questions.find((x) => x.key === key);
  const labels = values.map((v) => (q && q.options ? (q.options.find((o) => o.value === v) || {}).label || v : v));
  return `«${q ? q.label : key}» = ${labels.join(' / ')}`;
};
const out = [];
out.push('# Preguntas del cuestionario de diagnóstico', '');
out.push(`Versión ${f.version}. Una pregunta por pantalla. Las marcadas con * son obligatorias. Las que indican «solo si…» aparecen según una respuesta anterior: el bloque «Cómo compra tu cliente» abre ramas distintas para citas, local, pedidos, presupuestos, encargos, estancias, online y cuotas. Cada bloque termina con un hueco de texto libre opcional y hay otros que se abren cuando una respuesta pide explicación.`, '');
out.push('Generado con `node scripts/preguntas-md.cjs`; no editar a mano.', '');
out.push('## Antes de empezar', '', f.consent.text, '', `- [ ] ${f.consent.accept_label} *`, `- [ ] ${f.consent.marketing_label}`, '');
let n = 0;
for (const s of f.sections) {
  out.push(`## ${s.title}`, '');
  for (const q of f.questions.filter((q) => q.section === s.id)) {
    n += 1;
    const conds = q.showIf ? [].concat(q.showIf).map((c) => label(c.key, c.in || [c.eq])) : [];
    out.push(`${n}. **${q.label}**${q.required ? ' *' : ''}${q.type === 'multi' ? ' (varias opciones)' : ''}${conds.length ? ` · solo si ${conds.join(' y ')}` : ''}`);
    if (q.help) out.push(`   _${q.help}_`);
    if (q.options) out.push('   ' + q.options.map((o) => o.label).join(' · '));
    else out.push(`   Respuesta libre${q.type === 'textarea' ? ' (varias líneas)' : ''}`);
    out.push('');
  }
}
out.push('## Al terminar', '', `**${f.thanks.title_diag}** ${f.thanks.text_diag}`, '', `El cliente ve: resumen y fugas con su impacto estimado. No ve soluciones, orden ni plan: eso se cuenta en la llamada (${f.thanks.next_text})`, '');
fs.writeFileSync(path.join(__dirname, '..', 'PREGUNTAS.md'), out.join('\n'));
console.log('PREGUNTAS.md', n, 'preguntas');
