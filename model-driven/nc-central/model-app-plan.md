# NC Central — design

Central de tratativa de ocorrências de entrega do Grupo NC: fila, SLA, aprovação de reembolso e indicadores.

**Routing description:** App da central de atendimento do Grupo NC para atendentes, supervisores e gestores: triar e tratar ocorrências de entrega e atendimento, responder ao cliente, acompanhar a fila e o SLA, acompanhar reembolsos aguardando aprovação e manter motivos e transportadoras. Não cobre a abertura em campo (app canvas NC Campo), o autoatendimento do cliente (Portal do Cliente em Power Pages) nem a decisão de aprovação de reembolso, que acontece no Teams pelo Power Automate.

Documento de desenho gerado a partir de `app-spec.json`, que é a fonte da verdade do app.

## Environment

| Setting | Value |
|---|---|
| Environment | Ambiente Developer "NC Ocorrencias DEV" (URL omitida) |
| Solution | NCOcorrencias |
| Publisher prefix | nc |

## Jobs to be done

| Persona | Job to be done | Surfaces that satisfy it |
|---|---|---|
| NC Atendente | Triar ocorrências novas — Pegar as ocorrências sem responsável na fila, conferir o motivo e a prioridade e assumir a tratativa. | Novas ocorrências na fila, Ocorrência |
| NC Atendente | Tratar e responder ao cliente — Registrar interações, responder ao cliente, solicitar reembolso quando o motivo permitir e resolver a ocorrência. | Minhas ocorrências em aberto, Ocorrência, Nova interação |
| NC Atendente | Consultar pedido e cliente — Ver os dados do pedido, da transportadora e do cliente para entender a ocorrência. | Pedidos recentes, Pedido |
| NC Supervisor | Acompanhar a fila e o SLA — Ver o que está sem responsável, em risco ou estourado e agir antes de o prazo vencer. | painel-central, SLA em risco ou estourado |
| NC Supervisor | Acompanhar reembolsos aguardando aprovação — Ver as ocorrências paradas em aprovação e o resultado das aprovações já feitas. | Aguardando aprovação |
| NC Supervisor | Redistribuir ocorrências — Reatribuir ocorrências entre os atendentes para equilibrar a fila. | Ocorrências em aberto |
| NC Gestor | Acompanhar indicadores de ocorrências e SLA — Ver volume, cumprimento de SLA, motivos, transportadoras e reembolsos para priorizar ações. | painel-central, Resolvidas no mês |
| NC Gestor | Manter motivos e transportadoras — Cadastrar e ajustar motivos (com SLA e regra de reembolso) e transportadoras. | Motivos ativos, Motivo, Transportadoras ativas, Transportadora |

**Deliberately out of scope**

- NC Atendente — Abrir ocorrência em campo: feito pelo app canvas NC Campo
- NC Atendente — Aprovar reembolso: decisão do supervisor ou do gestor no Teams
- NC Supervisor — Decidir a aprovação de reembolso dentro do app: a decisão acontece no card do Teams
- NC Gestor — Análise histórica detalhada: feita no relatório de Power BI

## Data model

### Conta `account` _(existing table — reused, not created)_

| Column | Type | Notes |
|---|---|---|
| Nome da Conta | Text | primary name |

### Contato `contact` _(existing table — reused, not created)_

| Column | Type | Notes |
|---|---|---|
| Nome Completo | Text | primary name |

### Transportadora `nc_transportadora`

Transportadora parceira que entrega os pedidos do Grupo NC. O SLA contratual serve de referência para atrasos.

**Nav icon:** um caminhão de entrega visto de lado, com baú e cabine

| Column | Type | Notes |
|---|---|---|
| Nome | Text | primary name |
| CNPJ | Text | — |
| Região de atuação | Choice | choices: Sudeste, Sul, Centro-Oeste, Nordeste, Norte |
| SLA de entrega (dias) | Integer | — |

### Pedido `nc_pedido`

Pedido de venda entregue por uma transportadora. É a origem de toda ocorrência.

**Nav icon:** uma caixa de papelão fechada, em perspectiva

| Column | Type | Notes |
|---|---|---|
| Número do pedido | Text | primary name, auto-number `PED-{SEQNUM:6}` |
| Status do pedido | Choice | choices: Em separação, Em trânsito, Entregue, Devolvido, Cancelado |
| Data do pedido | DateTime | — |
| Entrega prevista | DateTime | — |
| Entrega realizada | DateTime | — |
| Valor do pedido | Money | — |
| UF de destino | Text | — |
| Cidade de destino | Text | — |
| Código de rastreio | Text | — |

### Motivo `nc_motivo`

Tabela de configuração dos motivos de ocorrência. Define os prazos de SLA, a prioridade padrão e se o motivo pode gerar reembolso.

**Nav icon:** uma etiqueta de preço com um furo no canto

| Column | Type | Notes |
|---|---|---|
| Motivo | Text | primary name |
| Categoria | Choice | choices: Logística, Produto, Atendimento, Financeiro |
| Prioridade padrão | Choice | global choice `nc_prioridade` |
| SLA de primeira resposta (horas) | Integer | — |
| SLA de solução (horas) | Integer | — |
| Pode gerar reembolso | Boolean | — |

### Ocorrência `nc_ocorrencia`

Ocorrência de entrega ou de atendimento ligada a um pedido, da abertura ao encerramento, com prazos de SLA, reembolso e avaliação do cliente.

**Nav icon:** um triângulo de alerta com um ponto de exclamação

| Column | Type | Notes |
|---|---|---|
| Protocolo | Text | primary name, auto-number `OC-{SEQNUM:6}` |
| Status | Choice | required; choices: Aberta, Em análise, Aguardando aprovação, Em tratativa, Resolvida, Cancelada |
| Prioridade | Choice | global choice `nc_prioridade` |
| Canal de abertura | Choice | choices: App de campo, Portal do cliente, Central, Assistente Teams |
| ID de origem | Text | — |
| Descrição | Memo | required |
| Situação do SLA | Choice | choices: No prazo, Em risco, Estourado, Cumprido, Não cumprido |
| Prazo da primeira resposta | DateTime | — |
| Prazo de solução | DateTime | — |
| Primeira resposta em | DateTime | — |
| Resolvida em | DateTime | — |
| Solução aplicada | Memo | — |
| Reembolso solicitado | Money | — |
| Aprovação do reembolso | Choice | choices: Não necessária, Pendente, Aprovada, Reprovada |
| Aprovado por | Text | — |
| Comentário da aprovação | Memo | — |
| Lançado no legado | Boolean | — |
| Nº do lançamento no legado | Text | — |
| Foto da evidência | Image | — |
| Latitude | Decimal | — |
| Longitude | Decimal | — |
| Avaliação do cliente | Integer | — |
| Comentário do cliente | Memo | — |

Notes/timeline enabled.

### Interação `nc_interacao`

Histórico da ocorrência: comentários internos, respostas ao cliente e registros automáticos. O portal mostra só o que for visível ao cliente.

**Nav icon:** dois balões de conversa sobrepostos

| Column | Type | Notes |
|---|---|---|
| Resumo | Text | primary name |
| Tipo | Choice | choices: Comentário interno, Resposta ao cliente, Mudança de status, Sistema |
| Texto | Memo | — |
| Visível ao cliente | Boolean | — |

### Relationships

| Kind | From | To | Lookup |
|---|---|---|---|
| 1:N | account | nc_pedido | nc_ClienteId |
| 1:N | nc_transportadora | nc_pedido | nc_TransportadoraId |
| 1:N | nc_pedido | nc_ocorrencia | nc_PedidoId |
| 1:N | account | nc_ocorrencia | nc_ClienteId |
| 1:N | nc_transportadora | nc_ocorrencia | nc_TransportadoraId |
| 1:N | nc_motivo | nc_ocorrencia | nc_MotivoId |
| 1:N | contact | nc_ocorrencia | nc_ContatoId |
| 1:N | nc_ocorrencia | nc_interacao | nc_OcorrenciaId |

## Surfaces

### Generative pages

| Page | Key | Purpose | Reads | Navigates to | State |
|---|---|---|---|---|---|
| Painel da Central | `painel-central` | Página inicial do app, mostrando o que precisa de atenção agora. Cartões de KPI: ocorrências em aberto, novas na fila (status Aberta), em risco, estouradas, aguardando aprovação e % de SLA cumprido entre as resolvidas no mês. Abaixo: ocorrências em aberto por motivo (barras), por transportadora (barras) e por prioridade, e uma tabela com as 10 ocorrências em aberto de prazo de solução mais próximo (protocolo, status, prioridade, situação do SLA, prazo, motivo), em que clicar no protocolo abre o registro no formulário de Ocorrência. Status em aberto = qualquer status diferente de Resolvida e Cancelada. | nc_ocorrencia, nc_motivo, nc_transportadora | — | intent (code not yet generated) |

### Forms

| Form | Table | Type | Layout | Sub-grids |
|---|---|---|---|---|
| Ocorrência | nc_ocorrencia | Main | explicit (3 tabs) | nc_interacao |
| Interação | nc_interacao | Main | auto | — |
| Nova interação | nc_interacao | QuickCreate | auto | — |
| Pedido | nc_pedido | Main | auto | nc_ocorrencia |
| Motivo | nc_motivo | Main | auto | — |
| Transportadora | nc_transportadora | Main | auto | nc_ocorrencia |

### Views

| View | Table | Columns | Filters | Sort |
|---|---|---|---|---|
| Minhas ocorrências em aberto | nc_ocorrencia | nc_protocolo, nc_status, nc_prioridade, nc_situacaosla, nc_prazosolucao, nc_clienteid, nc_motivoid | ownerid eq-userid; nc_status not-in Resolvida/Cancelada | nc_prazosolucao asc |
| Novas ocorrências na fila | nc_ocorrencia | nc_protocolo, nc_prioridade, nc_canal, nc_motivoid, nc_clienteid, nc_prazoresposta, createdon | nc_status eq Aberta | createdon asc |
| SLA em risco ou estourado | nc_ocorrencia | nc_protocolo, nc_situacaosla, nc_prazosolucao, nc_prioridade, nc_status, ownerid, nc_motivoid | nc_situacaosla in Em risco/Estourado; nc_status not-in Resolvida/Cancelada | nc_prazosolucao asc |
| Aguardando aprovação | nc_ocorrencia | nc_protocolo, nc_valorreembolso, nc_statusaprovacao, nc_clienteid, ownerid, modifiedon | nc_status eq Aguardando aprovação | nc_valorreembolso desc |
| Ocorrências em aberto | nc_ocorrencia | nc_protocolo, nc_status, nc_prioridade, nc_situacaosla, ownerid, nc_transportadoraid, nc_prazosolucao | nc_status not-in Resolvida/Cancelada | nc_prazosolucao asc |
| Resolvidas no mês | nc_ocorrencia | nc_protocolo, nc_dataresolucao, nc_situacaosla, nc_csat, nc_motivoid, ownerid | nc_status eq Resolvida; nc_dataresolucao this-month | nc_dataresolucao desc |
| Ocorrências recentes | nc_ocorrencia | nc_protocolo, nc_status, nc_motivoid, nc_situacaosla, createdon | — | createdon desc |
| Pedidos recentes | nc_pedido | nc_numero, nc_clienteid, nc_transportadoraid, nc_statuspedido, nc_dataprevista, nc_valor, nc_uf | — | nc_datapedido desc |
| Motivos ativos | nc_motivo | nc_name, nc_categoria, nc_prioridadepadrao, nc_slarespostahoras, nc_slasolucaohoras, nc_permitereembolso | — | nc_name asc |
| Transportadoras ativas | nc_transportadora | nc_name, nc_regiao, nc_slaentregadias, nc_cnpj | — | nc_name asc |
| Interações recentes | nc_interacao | nc_name, nc_tipo, nc_visivelcliente, nc_ocorrenciaid, createdon | — | createdon desc |

### Charts

| Chart | Table | Type | Measure | Grouped by |
|---|---|---|---|---|
| Ocorrências por situação do SLA | nc_ocorrencia | Pie | count | nc_situacaosla |
| Ocorrências por status | nc_ocorrencia | Column | count | nc_status |
| Ocorrências por prioridade | nc_ocorrencia | Pie | count | nc_prioridade |
| Ocorrências por canal | nc_ocorrencia | Bar | count | nc_canal |
| Pedidos por status | nc_pedido | Pie | count | nc_statuspedido |
| Motivos por categoria | nc_motivo | Column | count | nc_categoria |

## Navigation

- **Central**
  - Visão geral
    - Painel da Central → page `painel-central`
  - Atendimento
    - Ocorrências → table `nc_ocorrencia` — icon: the table's own
    - Pedidos → table `nc_pedido` — icon: the table's own
    - Clientes → table `account` — icon: the table's own
    - Contatos → table `contact` — icon: the table's own
  - Configuração
    - Motivos → table `nc_motivo` — icon: the table's own
    - Transportadoras → table `nc_transportadora` — icon: the table's own

## Security

### Role: NC Atendente

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| nc_ocorrencia | read, create, write, append, appendTo, assign | businessUnit |
| nc_pedido | read, appendTo | organization |
| account | read, appendTo | organization |
| contact | read, appendTo | organization |
| nc_motivo | read, appendTo | organization |
| nc_transportadora | read, appendTo | organization |
| nc_interacao | read, create, write, append | businessUnit |
| annotation | read, create, write, append, appendTo | user |

### Role: NC Supervisor

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| nc_ocorrencia | read, write, append, appendTo, assign, share | businessUnit |
| nc_interacao | read, create, append | businessUnit |
| nc_pedido | read, appendTo | organization |
| account | read, appendTo | organization |
| contact | read, appendTo | organization |
| nc_motivo | read, appendTo | organization |
| nc_transportadora | read, appendTo | organization |
| annotation | read, create, write, append, appendTo | user |

### Role: NC Gestor

The app is granted to this role, so it opens for this persona.

| Table | Access | Scope |
|---|---|---|
| nc_ocorrencia | read, write, assign | organization |
| nc_interacao | read | organization |
| nc_pedido | read, appendTo | organization |
| account | read, appendTo | organization |
| contact | read, appendTo | organization |
| nc_motivo | read, appendTo, create, write, delete, append | organization |
| nc_transportadora | read, appendTo, create, write, delete, append | organization |

## Sample data

| Table | Records |
|---|---|
| account | 5 |
| nc_transportadora | 4 |
| nc_motivo | 8 |
| nc_pedido | 10 |
| nc_ocorrencia | 10 |

## Design contract

| Token | Value |
|---|---|
| accentColor | #0b5f7c |
| density | comfortable |
| cornerRadius | medium |
| darkMode | system |
| layout | cards |

These tokens are threaded to every generative page so the app looks consistent.
