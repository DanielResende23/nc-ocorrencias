// ---------------- Type Definitions which can be imported from ./RuntimeTypes -------------------------
export interface TableRegistrations extends BaseTableRegistrations {
    "nc_motivo": nc_motivo,
    "nc_ocorrencia": nc_ocorrencia,
    "nc_transportadora": nc_transportadora,
}
export interface EnumRegistrations extends BaseEnumRegistrations {
    "nc_motivo-nc_categoria": nc_motivo_nc_categoria,
    "nc_motivo-nc_permitereembolso": nc_motivo_nc_permitereembolso,
    "nc_motivo-nc_prioridadepadrao": nc_motivo_nc_prioridadepadrao,
    "nc_motivo-statecode": nc_motivo_statecode,
    "nc_motivo-statuscode": nc_motivo_statuscode,
    "nc_ocorrencia-nc_canal": nc_ocorrencia_nc_canal,
    "nc_ocorrencia-nc_lancadolegado": nc_ocorrencia_nc_lancadolegado,
    "nc_ocorrencia-nc_prioridade": nc_ocorrencia_nc_prioridade,
    "nc_ocorrencia-nc_situacaosla": nc_ocorrencia_nc_situacaosla,
    "nc_ocorrencia-nc_status": nc_ocorrencia_nc_status,
    "nc_ocorrencia-nc_statusaprovacao": nc_ocorrencia_nc_statusaprovacao,
    "nc_ocorrencia-statecode": nc_ocorrencia_statecode,
    "nc_ocorrencia-statuscode": nc_ocorrencia_statuscode,
    "nc_transportadora-nc_regiao": nc_transportadora_nc_regiao,
    "nc_transportadora-statecode": nc_transportadora_statecode,
    "nc_transportadora-statuscode": nc_transportadora_statuscode,
}
export type nc_motivo = TableRow<{
    // Primary Key Column
    readonly nc_motivoid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    nc_categoria: nc_motivo_nc_categoria,
    nc_name: string,
    nc_permitereembolso: nc_motivo_nc_permitereembolso,
    nc_prioridadepadrao: nc_motivo_nc_prioridadepadrao,
    nc_slarespostahoras: number,
    nc_slasolucaohoras: number,
    readonly owningbusinessunitname: string,
    statecode: nc_motivo_statecode,
    statuscode: nc_motivo_statuscode,
}>

export type nc_ocorrencia = TableRow<{
    // Primary Key Column
    readonly nc_ocorrenciaid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    readonly exchangerate: number,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    nc_aprovador: string,
    nc_canal: nc_ocorrencia_nc_canal,
    // Foreign Key Column
    readonly _nc_clienteid_value: `/account(${string})`,
    readonly nc_clienteidname: string,
    readonly nc_clienteidyominame: string,
    nc_comentarioaprovacao: string,
    nc_comentariocliente: string,
    // Foreign Key Column
    readonly _nc_contatoid_value: `/contact(${string})`,
    readonly nc_contatoidname: string,
    readonly nc_contatoidyominame: string,
    nc_csat: number,
    nc_dataprimeiraresposta: Date,
    nc_dataresolucao: Date,
    nc_descricao: string,
    // This is an image encoded as a base64 string
    nc_foto: string,
    readonly nc_foto_timestamp: number,
    readonly nc_foto_url: string,
    readonly nc_fotoid: string,
    nc_idorigem: string,
    nc_lancadolegado: nc_ocorrencia_nc_lancadolegado,
    nc_latitude: number,
    nc_longitude: number,
    // Foreign Key Column
    _nc_motivoid_value: `/nc_motivo(${string})`,
    readonly nc_motivoidname: string,
    nc_numerolancamento: string,
    // Foreign Key Column
    readonly _nc_pedidoid_value: `/nc_pedido(${string})`,
    readonly nc_pedidoidname: string,
    nc_prazoresposta: Date,
    nc_prazosolucao: Date,
    nc_prioridade: nc_ocorrencia_nc_prioridade,
    nc_protocolo: string,
    nc_situacaosla: nc_ocorrencia_nc_situacaosla,
    nc_solucao: string,
    nc_status: nc_ocorrencia_nc_status,
    nc_statusaprovacao: nc_ocorrencia_nc_statusaprovacao,
    // Foreign Key Column
    _nc_transportadoraid_value: `/nc_transportadora(${string})`,
    readonly nc_transportadoraidname: string,
    nc_valorreembolso: number,
    readonly nc_valorreembolso_base: number,
    readonly owningbusinessunitname: string,
    processid: string,
    stageid: string,
    statecode: nc_ocorrencia_statecode,
    statuscode: nc_ocorrencia_statuscode,
    // Foreign Key Column
    readonly _transactioncurrencyid_value: `/transactioncurrency(${string})`,
    readonly transactioncurrencyidname: string,
    traversedpath: string,
}>

export type nc_transportadora = TableRow<{
    // Primary Key Column
    readonly nc_transportadoraid: string,
    readonly createdbyname: string,
    readonly createdbyyominame: string,
    readonly createdonbehalfbyname: string,
    readonly createdonbehalfbyyominame: string,
    readonly modifiedbyname: string,
    readonly modifiedbyyominame: string,
    readonly modifiedonbehalfbyname: string,
    readonly modifiedonbehalfbyyominame: string,
    nc_cnpj: string,
    nc_name: string,
    nc_regiao: nc_transportadora_nc_regiao,
    nc_slaentregadias: number,
    readonly owningbusinessunitname: string,
    statecode: nc_transportadora_statecode,
    statuscode: nc_transportadora_statuscode,
}>

const enum nc_motivo_nc_categoria {
"Logística" = 100000000,
"Produto" = 100000001,
"Atendimento" = 100000002,
"Financeiro" = 100000003,
}
const enum nc_motivo_nc_permitereembolso {
"Não" = 0,
"Sim" = 1,
}
const enum nc_motivo_nc_prioridadepadrao {
"Baixa" = 100000000,
"Média" = 100000001,
"Alta" = 100000002,
"Crítica" = 100000003,
}
const enum nc_motivo_statecode {
"Ativo(a)" = 0,
"Inativo(a)" = 1,
}
const enum nc_motivo_statuscode {
"Ativo(a)" = 1,
"Inativo(a)" = 2,
}
const enum nc_ocorrencia_nc_canal {
"App de campo" = 100000000,
"Portal do cliente" = 100000001,
"Central" = 100000002,
"Assistente Teams" = 100000003,
}
const enum nc_ocorrencia_nc_lancadolegado {
"Não" = 0,
"Sim" = 1,
}
const enum nc_ocorrencia_nc_prioridade {
"Baixa" = 100000000,
"Média" = 100000001,
"Alta" = 100000002,
"Crítica" = 100000003,
}
const enum nc_ocorrencia_nc_situacaosla {
"No prazo" = 100000000,
"Em risco" = 100000001,
"Estourado" = 100000002,
"Cumprido" = 100000003,
"Não cumprido" = 100000004,
}
const enum nc_ocorrencia_nc_status {
"Aberta" = 100000000,
"Em análise" = 100000001,
"Aguardando aprovação" = 100000002,
"Em tratativa" = 100000003,
"Resolvida" = 100000004,
"Cancelada" = 100000005,
}
const enum nc_ocorrencia_nc_statusaprovacao {
"Não necessária" = 100000000,
"Pendente" = 100000001,
"Aprovada" = 100000002,
"Reprovada" = 100000003,
}
const enum nc_ocorrencia_statecode {
"Ativo(a)" = 0,
"Inativo(a)" = 1,
}
const enum nc_ocorrencia_statuscode {
"Ativo(a)" = 1,
"Inativo(a)" = 2,
}
const enum nc_transportadora_nc_regiao {
"Sudeste" = 100000000,
"Sul" = 100000001,
"Centro-Oeste" = 100000002,
"Nordeste" = 100000003,
"Norte" = 100000004,
}
const enum nc_transportadora_statecode {
"Ativo(a)" = 0,
"Inativo(a)" = 1,
}
const enum nc_transportadora_statuscode {
"Ativo(a)" = 1,
"Inativo(a)" = 2,
}

export interface UxAgentDataApi extends BaseUxAgentDataApi<TableRegistrations, EnumRegistrations> {}

export interface GeneratedComponentProps {
    dataApi: UxAgentDataApi;
}

