// Lê os valores numéricos das colunas de escolha do NC Ocorrências e grava em docs/opcoes.json.
// Os valores são definidos pelo publisher no ambiente, então flows e apps não devem fixá-los sem conferir.
// Uso: node ler-opcoes.js <envUrl> <pastaFerramentas> <saida.json>
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [envUrl, pastaFerramentas, saida] = process.argv.slice(2);
const req = path.join(pastaFerramentas, 'scripts', 'dataverse-request.js');
const call = (apiPath) => JSON.parse(execFileSync('node', [req, envUrl, 'GET', apiPath], { encoding: 'utf8' }).replace(/^﻿/, ''));

const alvos = [
  ['nc_ocorrencia', 'nc_status'], ['nc_ocorrencia', 'nc_situacaosla'], ['nc_ocorrencia', 'nc_prioridade'],
  ['nc_ocorrencia', 'nc_canal'], ['nc_ocorrencia', 'nc_statusaprovacao'], ['nc_interacao', 'nc_tipo'],
  ['nc_motivo', 'nc_categoria'], ['nc_pedido', 'nc_statuspedido'],
];
const resultado = {};
for (const [tabela, coluna] of alvos) {
  const r = call(`EntityDefinitions(LogicalName='${tabela}')/Attributes(LogicalName='${coluna}')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options),GlobalOptionSet($select=Options)`);
  const opts = ((r.data.OptionSet && r.data.OptionSet.Options) || (r.data.GlobalOptionSet && r.data.GlobalOptionSet.Options) || []);
  resultado[`${tabela}.${coluna}`] = Object.fromEntries(opts.map((o) => [o.Label.UserLocalizedLabel.Label, o.Value]));
}
fs.writeFileSync(saida, JSON.stringify(resultado, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(resultado, null, 1));
