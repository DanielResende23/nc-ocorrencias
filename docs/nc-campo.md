# NC Campo: canvas app de abertura de ocorrências em campo

App de celular usado por motoristas e atendentes de campo para abrir ocorrências de entrega. Faz parte da fase 1 do NC Ocorrências (ver [arquitetura.md](arquitetura.md)).

## Onde está

| Item | Valor |
|---|---|
| Ambiente | NC Ocorrencias DEV (ambiente Developer só deste projeto) |
| Solution | NC Ocorrências (`NCOcorrencias`): o app entra como componente do tipo 300 |
| App | NC Campo, nome lógico `nc_nccampo_21458`, formato celular (retrato) |
| Código-fonte | [`canvas/nc-campo/`](../canvas/nc-campo), arquivos `.pa.yaml` sincronizados do Studio |
| Formato do código-fonte | `.pa.yaml` (YAML do Power Apps), com telas, componentes e `App.Formulas` versionados no Git |

## Telas

| Tela | Arquivo | O que faz |
|---|---|---|
| Início | `Screen1.pa.yaml` | Mostra as ocorrências abertas pelo usuário atual, em cards com protocolo, data, motivo, pedido, selo de status e selo de SLA. Uma faixa lateral também tem a cor do SLA. Tem os botões "Nova ocorrência" e "Atualizar". Mostra um aviso quando a lista está vazia. Tocar no card abre o detalhe. |
| Nova ocorrência | `scrNovaOcorrencia.pa.yaml` | Três passos na mesma tela, com o indicador "1 · Pedido / 2 · Motivo / 3 · Evidência" e um rodapé com "Voltar" e "Continuar"/"Enviar". **1. Pedido:** controle Barcode reader, comparando com o rastreio, ou busca por número ou rastreio, com o cartão do pedido selecionado. **2. Motivo:** lista dos motivos ativos, com categoria e SLA em horas. **3. Evidência:** câmera ou "Adicionar imagem" com pré-visualização, latitude e longitude pela função `Location`, e descrição obrigatória. |
| Confirmação | `scrConfirmacao.pa.yaml` | Protocolo em destaque, card da ocorrência, prioridade, prazos de primeira resposta e de solução devolvidos pelo fluxo e se o comprovante foi enviado por e-mail. Tem os botões "Ver ocorrência" e "Voltar ao início". |
| Detalhe | `scrDetalhe.pa.yaml` | Card da ocorrência; status, prioridade e SLA em selos; prazos; descrição; foto e coordenadas; histórico de `nc_interacao` só com o que é visível ao cliente. |

## Componentes (`canvas/nc-campo/Components/`)

| Componente | Entradas | Uso |
|---|---|---|
| `cmpCabecalho` | `Titulo`, `Subtitulo` | Faixa `#005979` com "GRUPO NC", o nome da tela e um subtítulo. Aparece nas 4 telas. Nas telas com voltar, fica numa faixa junto com o botão de seta. |
| `cmpSeloStatus` | `Texto`, `Cor` | Selo com fundo clareado (`ColorFade` de 82%) e texto escurecido. Usado para status, prioridade e SLA. |
| `cmpCardOcorrencia` | `Protocolo`, `Motivo`, `Pedido`, `Abertura`, `Status`, `CorStatus`, `SituacaoSLA`, `CorSLA` | Card com faixa lateral na cor do SLA. Usado na Confirmação e no Detalhe. |

**Limite da plataforma:** componente de canvas não pode ficar dentro de galeria. Por isso a lista do Início e o histórico do Detalhe repetem o desenho do card com controles comuns. As cores vêm das mesmas funções do app, então o visual é igual ao dos componentes.

## Power Fx: decisões

- **Tema:** as cores e a fonte são fórmulas nomeadas em `App.Formulas`:
  - `CorPrimaria` e as demais cores, além de `FonteNC` = Poppins com Segoe UI de reserva;
  - as funções `CorSLA()`, `CorPrioridade()` e `CorStatus()` recebem o texto da escolha e devolvem a cor. É a mesma regra do NC Central: No prazo e Cumprido em verde, Em risco em laranja, Estourado e Não cumprido em vermelho.
- **Consultas delegáveis ao Dataverse:**
  - `UsuarioAtual = LookUp(Usuários, 'Email Primário' = User().Email)`;
  - `MinhasOcorrencias = Sort(Filter(Ocorrências, 'Criada Por'.Usuário = UsuarioAtual.Usuário), 'Data de Criação', SortOrder.Descending)`;
  - pedido pelo código de barras: `LookUp(Pedidos, 'Código de rastreio' = codigo)`;
  - busca: `StartsWith` em `'Número do pedido'` ou em `'Código de rastreio'`;
  - histórico: `Filter(Interações, Ocorrência.Ocorrência = ... && 'Visível ao cliente' = 'Visível ao cliente (Interações)'.Sim)`.
- **Coleção:** só `colMotivos`, carregada no `App.OnStart` com os motivos ativos. É uma tabela de configuração pequena, usada como cache. O App Checker sugere trocá-la por uma fórmula nomeada; a coleção ficou de propósito.
- **Envio:**
  - um `Patch(Ocorrências, Defaults(Ocorrências), {...})` grava canal "App de campo", status "Aberta", `'ID de origem'` = `"APP-" & GUID()`, as consultas de pedido e motivo, a foto em `'Foto da evidência'` (registro `{Full, Value}` lido do controle de imagem), latitude, longitude e descrição;
  - o erro é tratado com `IfError` e `Notify`;
  - depois do sucesso, o app chama `'NC-App-Protocolo'.Run(Text(ocorrencia))`, num `IfError` próprio: se só o fluxo falhar, o registro continua salvo e a tela de confirmação ainda abre;
  - por fim, relê a ocorrência e navega para a Confirmação.
- **Campos que o app não grava:** prazos, prioridade, cliente, transportadora e situação do SLA são do fluxo **NC - Ocorrência - Abertura**, que dispara na criação.
- **Detalhes descobertos pelo compilador:**
  - o leitor de código de barras devolve `First(Self.Barcodes.Value).Value`;
  - a coluna de imagem exige um registro com `Full` e `Value`;
  - o campo de status aparece como `'Status (nc_status)'`, porque o nome conflita com o `statecode`;
  - os campos Sim/Não aparecem como escolhas.

## Teste de ponta a ponta (25/11/2026)

Ocorrência aberta pelo app, no modo de visualização do Studio: **OC-001011**.

| Verificação | Resultado |
|---|---|
| O app criou o registro | ✅ canal App de campo, status Aberta, `nc_idorigem` = `APP-3b2bdc4a-…`, pedido PED-001001 (NC2611000102), motivo, descrição e "Criado por" = usuário do teste |
| Fluxo NC - App - Protocolo | ✅ rodou de 21:54:07 a 21:54:52 UTC e devolveu o protocolo **OC-001011** para a tela de confirmação. Prazos e e-mail vieram vazios: o fluxo de abertura ainda não tinha rodado, e a ocorrência do app não tem contato. |
| Fluxo NC - Ocorrência - Abertura | ✅ disparou às 21:56:47 UTC, 2min43s depois da criação, e preencheu tudo. **Prioridade:** Crítica, porque o pedido é de R$ 12.650, acima de R$ 10 mil. **Prazos:** primeira resposta em 24h e solução em 120h, que são os SLAs do motivo "Atendimento insatisfatório". **SLA:** No prazo. **Cliente:** Rede Farmavida. **Transportadora:** TransVia Logística. **Interação:** "Ocorrência OC-001011 aberta", do tipo Sistema e visível ao cliente. |
| Latitude e longitude | vazias neste teste: no navegador do Studio, a localização não foi liberada |
| Foto | não enviada; é opcional |

## Pendências e observações

- **Demora do gatilho do Dataverse:** o fluxo de abertura dispara de forma assíncrona. No teste do fluxo, às 18:21, ele rodou em 2 segundos. No teste do app, levou 2min43s. Já o fluxo de protocolo espera no máximo uns 45 segundos, e o Power Apps aceita até 120 segundos de resposta. Por isso, a Confirmação pode mostrar os prazos como "Em cálculo". A tela de Detalhe relê o registro ao abrir e mostra os prazos certos. Há duas melhorias possíveis:
  - o fluxo de protocolo calcular os prazos pelo motivo, sem esperar o de abertura;
  - a Confirmação ganhar um botão "Atualizar".
- **Largura da linha da galeria:** no Studio, a linha da galeria do Início trocou `Width: =Parent.TemplateWidth` por `320` fixo, e os cards ficaram com metade da largura. Já corrigi no YAML. Se alguém redimensionar a linha pelo Studio, o problema volta.
- **Publicação:** o app foi salvo e publicado no Studio em 25/11/2026 às 22:02:30 UTC (`lastpublishtime` no Dataverse), dentro do ambiente de dev. Os `.pa.yaml` desta pasta são a versão publicada.
- **Fontes de dados sobrando:** o Studio acrescentou Atividades e Contatos, que o app não usa. Contas é usada para mostrar o nome do cliente.
