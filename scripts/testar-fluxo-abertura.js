// Teste de ponta a ponta do fluxo "NC - Ocorrência - Abertura".
// Cria uma ocorrência só com pedido, motivo, canal e descrição e espera o fluxo completar
// prazos, prioridade, cliente, transportadora e a interação de abertura.
// Uso: node testar-fluxo-abertura.js <envUrl> <pastaFerramentas> <rastreioDoPedido> "<nome do motivo>" <idOrigem>
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const [envUrl, pastaFerramentas, rastreio, motivoNome, idOrigem] = process.argv.slice(2);
const req = path.join(pastaFerramentas, 'scripts', 'dataverse-request.js');
const call = (method, apiPath, body) => {
  const args = [req, envUrl, method, apiPath];
  if (body) {
    const f = path.join(os.tmpdir(), `teste-${Date.now()}.json`);
    fs.writeFileSync(f, JSON.stringify(body), 'utf8');
    args.push('--body', '@' + f, '--include-headers');
  }
  return JSON.parse(execFileSync('node', args, { encoding: 'utf8' }).replace(/^﻿/, ''));
};
const esperar = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const pedido = call('GET', `nc_pedidos?$select=nc_pedidoid,nc_valor&$filter=nc_rastreio eq '${rastreio}'`).data.value[0];
const motivo = call('GET', `nc_motivos?$select=nc_motivoid&$filter=nc_name eq '${motivoNome}'`).data.value[0];
const criado = call('POST', 'nc_ocorrencias', {
  nc_idorigem: idOrigem,
  nc_status: 100000000,
  nc_canal: 100000002,
  nc_descricao: 'Teste do fluxo de abertura: produto chegou com defeito na conferência.',
  'nc_PedidoId@odata.bind': `/nc_pedidos(${pedido.nc_pedidoid})`,
  'nc_MotivoId@odata.bind': `/nc_motivos(${motivo.nc_motivoid})`,
});
const id = (criado.headers['odata-entityid'] || criado.headers['OData-EntityId']).match(/\(([^)]+)\)/)[1];
console.log(`Criada: ${id} (pedido de R$ ${pedido.nc_valor})`);

const sel = 'nc_protocolo,nc_prioridade,nc_prazoresposta,nc_prazosolucao,nc_situacaosla,_nc_clienteid_value,_nc_transportadoraid_value,createdon';
for (let i = 0; i < 12; i++) {
  esperar(10000);
  const oc = call('GET', `nc_ocorrencias(${id})?$select=${sel}`).data;
  if (oc.nc_prazosolucao) {
    const hist = call('GET', `nc_interacaos?$select=nc_name,nc_texto&$filter=_nc_ocorrenciaid_value eq ${id}`).data.value;
    console.log(JSON.stringify({ ...oc, interacoes: hist }, null, 2));
    process.exit(0);
  }
  console.log(`aguardando o fluxo... (${(i + 1) * 10}s)`);
}
console.log('O fluxo não completou em 2 minutos.');
process.exit(1);
