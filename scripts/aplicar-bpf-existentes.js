// Aplica o fluxo de processo "Tratativa NC" às ocorrências criadas antes de o fluxo existir e
// deixa cada uma na etapa que corresponde ao seu status. Pode rodar de novo: ajusta a etapa
// das instâncias que já existem.
// Uso: node aplicar-bpf-existentes.js <envUrl> <pastaFerramentas>
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const [envUrl, pastaFerramentas] = process.argv.slice(2);
const req = path.join(pastaFerramentas, 'scripts', 'dataverse-request.js');

function call(method, apiPath, body) {
  const args = [req, envUrl, method, apiPath];
  if (body) {
    const f = path.join(os.tmpdir(), `bpf-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    fs.writeFileSync(f, JSON.stringify(body), 'utf8');
    args.push('--body', '@' + f);
  }
  const out = execFileSync('node', args, { encoding: 'utf8' }).replace(/^﻿/, '');
  return JSON.parse(out);
}

const PROCESS_ID = 'a4cfc50a-6181-4488-b16f-fa3265e7b1ce';

// Nomes das opções de status (o valor numérico é definido pelo publisher, então nunca fixo no código)
const meta = call('GET',
  "EntityDefinitions(LogicalName='nc_ocorrencia')/Attributes(LogicalName='nc_status')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)").data;
const rotulo = Object.fromEntries(meta.OptionSet.Options.map((o) => [o.Value, o.Label.UserLocalizedLabel.Label]));

const stages = call('GET', `processstages?$select=stagename&$filter=_processid_value eq ${PROCESS_ID}`).data.value;
const stageId = Object.fromEntries(stages.map((s) => [s.stagename, s.processstageid]));
const ordem = ['Abertura', 'Análise', 'Aprovação', 'Tratativa', 'Encerramento'];
const etapaDoStatus = {
  'Aberta': 'Abertura', 'Em análise': 'Análise', 'Aguardando aprovação': 'Aprovação',
  'Em tratativa': 'Tratativa', 'Resolvida': 'Encerramento', 'Cancelada': 'Encerramento',
};

const instancias = Object.fromEntries(
  call('GET', 'new_tratativancs?$select=businessprocessflowinstanceid,_bpf_nc_ocorrenciaid_value').data.value
    .map((r) => [r._bpf_nc_ocorrenciaid_value, r.businessprocessflowinstanceid])
);
const ocorrencias = call('GET', 'nc_ocorrencias?$select=nc_protocolo,nc_status&$orderby=nc_protocolo').data.value;

for (const oc of ocorrencias) {
  const status = rotulo[oc.nc_status];
  const etapa = etapaDoStatus[status] || 'Abertura';
  const corpo = {
    'activestageid@odata.bind': `/processstages(${stageId[etapa]})`,
    traversedpath: ordem.slice(0, ordem.indexOf(etapa) + 1).map((n) => stageId[n]).join(','),
  };
  const id = instancias[oc.nc_ocorrenciaid];
  const res = id
    ? call('PATCH', `new_tratativancs(${id})`, corpo)
    : call('POST', 'new_tratativancs', {
        ...corpo,
        'bpf_nc_ocorrenciaid@odata.bind': `/nc_ocorrencias(${oc.nc_ocorrenciaid})`,
        'processid@odata.bind': `/workflows(${PROCESS_ID})`,
      });
  console.log(`${oc.nc_protocolo} (${status}) → ${etapa}: HTTP ${res.status}`);
}
