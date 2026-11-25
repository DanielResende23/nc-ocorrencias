import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactElement } from "react";
import type { GeneratedComponentProps } from "./RuntimeTypes";
import {
    Badge,
    Button,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    Dropdown,
    Link,
    MessageBar,
    MessageBarActions,
    MessageBarBody,
    MessageBarTitle,
    Option,
    SearchBox,
    Spinner,
    TableCellLayout,
    createTableColumn,
    makeStyles,
    mergeClasses,
    tokens,
    useId,
    webLightTheme,
} from "@fluentui/react-components";
import type { BadgeProps, TableColumnDefinition } from "@fluentui/react-components";
import {
    ArrowClockwiseRegular,
    CalendarClockRegular,
    CheckmarkCircleRegular,
    DismissRegular,
    ErrorCircleRegular,
    FlagRegular,
    HourglassHalfRegular,
    PeopleQueueRegular,
    SearchRegular,
    TagRegular,
    TaskListLtrRegular,
    VehicleTruckProfileRegular,
    WarningRegular,
} from "@fluentui/react-icons";

// ---------------------------------------------------------------------------
// Painel da Central — página inicial do app NC Central.
// Identidade visual do dashboard de Power BI do Grupo NC: Poppins, tema claro,
// faixa azul petróleo com "GRUPO NC" e KPIs translúcidos, cartões brancos com
// cabeçalho azul petróleo e tabela com cabeçalho #005979.
// "Em aberto" = qualquer nc_status diferente de Resolvida e Cancelada.
// ---------------------------------------------------------------------------

// ---------- Props ----------

type PageInput = {
    entityName?: string;
    recordId?: string;
    data?: Record<string, unknown>;
};

type PageProps = GeneratedComponentProps & { pageInput?: PageInput };

type DataApi = GeneratedComponentProps["dataApi"];

// ---------- Identidade visual (contrato de design) ----------

const NC_PRIMARY = "#005979";
const NC_ACCENT = "#3085BA";
const NC_DARK = "#015873";
const NC_PAGE_BG = "#F9F9F9";
const NC_TEXT = "#2D2D2D";
const NC_TEXT_MUTED = "#5C5C5C";
const NC_HERO_TITLE = "#DDF0FA";
const NC_WHITE = "#FFFFFF";
const NC_PRIMARY_HOVER = "#004A64";
const NC_PRIMARY_PRESSED = "#003B50";
const NC_TINT = "#EAF4F8";
const NC_TINT_STRONG = "#D6EAF2";
const NC_TRACK = "#E6EDF0";
const NC_RED = "#C0392B";
const NC_ORANGE = "#D9822B";
const NC_GRAY = "#8A8A8A";
const NC_GLASS_BG = "rgba(255, 255, 255, 0.22)";
const NC_GLASS_BORDER = "rgba(255, 255, 255, 0.35)";
const NC_CARD_SHADOW = "0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 14px rgba(0, 89, 121, 0.08)";
const NC_HERO_SHADOW = "0 6px 20px rgba(0, 89, 121, 0.18)";

const FONT_STACK =
    "'Poppins', 'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif";
const FONT_IMPORT_CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');";

// ---------- Choice values (verified in RuntimeTypes.ts) ----------

const STATUS_ABERTA = 100000000;
const STATUS_EM_ANALISE = 100000001;
const STATUS_AGUARDANDO_APROVACAO = 100000002;
const STATUS_EM_TRATATIVA = 100000003;
const STATUS_RESOLVIDA = 100000004;
const STATUS_CANCELADA = 100000005;

const PRIORIDADE_BAIXA = 100000000;
const PRIORIDADE_MEDIA = 100000001;
const PRIORIDADE_ALTA = 100000002;
const PRIORIDADE_CRITICA = 100000003;
const PRIORIDADE_ORDER = [PRIORIDADE_CRITICA, PRIORIDADE_ALTA, PRIORIDADE_MEDIA, PRIORIDADE_BAIXA];

const SLA_NO_PRAZO = 100000000;
const SLA_EM_RISCO = 100000001;
const SLA_ESTOURADO = 100000002;
const SLA_CUMPRIDO = 100000003;
const SLA_NAO_CUMPRIDO = 100000004;
const SLA_FILTER_OPTIONS = [SLA_NO_PRAZO, SLA_EM_RISCO, SLA_ESTOURADO];

// ---------- Limits ----------

const PAGE_SIZE = 500;
const MAX_OPEN_ROWS = 5000;
const MAX_RESOLVED_ROWS = 5000;
const TABLE_LIMIT = 10;
const BAR_MAX_VISIBLE = 6;
const NONE_KEY = "__none__";
const FORMATTED = "@OData.Community.Display.V1.FormattedValue";

// ---------- window cache + in-flight de-dupe (survives host double-mount) ----------

const CACHE_KEY = "__ppPainelCentral_ocorrenciaDashboardCache";
const INFLIGHT_KEY = "__ppPainelCentral_ocorrenciaDashboardInflight";
const SETTINGS_KEY = "__ppUserSettings";
const SETTINGS_INFLIGHT_KEY = "__ppUserSettingsInflight";
const CACHE_TTL_MS = 5 * 60 * 1000;
const winAny = window as unknown as Record<string, unknown>;

// ---------- Types ----------

type ODataRow = { [key: string]: unknown };

type OpenRow = ODataRow & {
    nc_ocorrenciaid?: string;
    nc_protocolo?: string;
    nc_status?: number;
    nc_prioridade?: number;
    nc_situacaosla?: number;
    nc_prazosolucao?: string | Date;
    _nc_motivoid_value?: string;
    _nc_transportadoraid_value?: string;
};

type ResolvedRow = ODataRow & {
    nc_ocorrenciaid?: string;
    nc_situacaosla?: number;
};

type DashboardData = {
    open: OpenRow[];
    resolvedMonth: ResolvedRow[];
    openTruncated: boolean;
    resolvedTruncated: boolean;
    monthStart: number;
    loadedAt: number;
};

type LoadState = {
    dashboard: DashboardData | null;
    loading: boolean;
    refreshing: boolean;
    error: boolean;
};

type PagedResult = {
    rows: unknown[];
    hasMoreRows?: boolean;
    loadMoreRows?: () => Promise<PagedResult>;
};

type OpenItem = {
    id: string;
    protocolo: string;
    status?: number;
    statusLabel: string;
    prioridade?: number;
    prioridadeKey: string;
    prioridadeLabel: string;
    sla?: number;
    slaLabel: string;
    prazo: Date | null;
    motivoKey: string;
    motivoLabel: string;
    transportadoraKey: string;
    transportadoraLabel: string;
};

type BarTone = "primary" | "critical" | "high" | "medium" | "neutral";

type BarDatum = {
    key: string;
    label: string;
    count: number;
    tone: BarTone;
};

type DrillDim = "motivo" | "transportadora" | "prioridade";

type Drill = Partial<Record<DrillDim, { key: string; label: string }>>;

type BadgeColor = NonNullable<BadgeProps["color"]>;

type Translate = (key: string) => string;

type NumberFormatter = (value: number) => string;

type UserSettingsRow = {
    uilanguageid?: number;
    localeid?: number;
    decimalsymbol?: string;
    numberseparator?: string;
    currencysymbol?: string;
    dateformatstring?: string;
    dateseparator?: string;
};

type SettingsApi = {
    retrieveRow: (entityName: string, options: { id: string; select: string[] }) => Promise<UserSettingsRow>;
};

type XrmLike = {
    Utility?: {
        getGlobalContext?: () => { userSettings?: { languageId?: number; userId?: string } } | undefined;
    };
    Navigation?: {
        navigateTo?: (pageInput: Record<string, unknown>, options?: Record<string, unknown>) => unknown;
    };
};

type LanguageInfo = { code: string; name: string; isRtl: boolean };

// ---------- Localization ----------

const LANGUAGES: Record<number, LanguageInfo> = {
    1046: { code: "pt-BR", name: "Português (Brasil)", isRtl: false },
};

const DEFAULT_LANGUAGE: LanguageInfo = LANGUAGES[1046];

const translations: Record<string, Record<string, string>> = {
    "pt-BR": {
        brand: "GRUPO NC",
        heroSubtitle: "Central de Ocorrências",
        heroTagline: "O que precisa de atenção agora nas ocorrências de entrega",
        refresh: "Atualizar",
        refreshing: "Atualizando…",
        refreshAria: "Atualizar os dados do painel",
        updatedAt: "Atualizado às {time}",
        loading: "Carregando painel…",
        waitingData: "Aguardando conexão com os dados…",
        errorTitle: "Não foi possível carregar o painel",
        loadError: "Verifique sua conexão e tente novamente.",
        retry: "Tentar novamente",
        navError: "Não foi possível abrir o registro da ocorrência.",
        dismiss: "Fechar aviso",
        truncatedNotice: "Exibindo as primeiras {n} ocorrências em aberto. Os indicadores podem estar incompletos.",
        kpiSection: "Indicadores",
        kpiOpen: "Ocorrências em aberto",
        kpiOpenHint: "Status diferente de Resolvida e Cancelada",
        kpiNew: "Novas na fila",
        kpiNewHint: "Com status Aberta, aguardando triagem",
        kpiRisk: "Em risco",
        kpiRiskHint: "Em aberto com SLA em risco",
        kpiBreached: "Estouradas",
        kpiBreachedHint: "Em aberto com SLA estourado",
        kpiApproval: "Aguardando aprovação",
        kpiApprovalHint: "Reembolsos pendentes de decisão",
        kpiSla: "SLA cumprido no mês",
        kpiSlaHint: "{met} de {total} resolvidas em {month}",
        kpiSlaEmpty: "Nenhuma ocorrência resolvida em {month}",
        chartsSection: "Ocorrências em aberto",
        chartsHint: "Selecione uma barra para filtrar a tabela de prazos.",
        byMotivo: "Por motivo",
        byTransportadora: "Por transportadora",
        byPrioridade: "Por prioridade",
        noOpen: "Nenhuma ocorrência em aberto no momento.",
        showAll: "Mostrar todos ({n})",
        showLess: "Mostrar menos",
        barAria: "{label}: {count}, {pct} das abertas. Filtrar a tabela por este item.",
        barAriaSelected: "{label}: {count}, {pct} das abertas. Filtro ativo; selecione para remover.",
        noMotivo: "Sem motivo",
        noTransportadora: "Sem transportadora",
        noPrioridade: "Sem prioridade",
        unnamedRecord: "(sem nome)",
        tableTitle: "Prazos de solução mais próximos",
        tableSubtitle: "As 10 ocorrências em aberto com prazo de solução mais próximo. Selecione o protocolo para abrir o registro.",
        tableCount: "{shown} de {total} ocorrências em aberto",
        tableCountFiltered: "{shown} de {matched} ocorrências que atendem aos filtros",
        searchPlaceholder: "Buscar por protocolo, motivo ou transportadora",
        searchAria: "Buscar ocorrências em aberto",
        slaFilterAria: "Filtrar por situação do SLA",
        slaAll: "Todas as situações de SLA",
        activeFilters: "Filtros ativos:",
        removeFilter: "Remover filtro {label}",
        clearFilters: "Limpar filtros",
        dimMotivo: "Motivo",
        dimTransportadora: "Transportadora",
        dimPrioridade: "Prioridade",
        colProtocolo: "Protocolo",
        colStatus: "Status",
        colPrioridade: "Prioridade",
        colSla: "Situação do SLA",
        colPrazo: "Prazo de solução",
        colMotivo: "Motivo",
        gridAria: "Ocorrências em aberto com prazo de solução mais próximo",
        openRecordAria: "Abrir a ocorrência {protocolo}",
        noProtocolo: "(sem protocolo)",
        noPrazo: "Sem prazo definido",
        noResults: "Nenhuma ocorrência em aberto corresponde aos filtros.",
        dueNow: "vence agora",
        dueIn: "vence em {v}",
        overdueBy: "venceu há {v}",
        unitMin: "{n} min",
        unitHour: "{n} h",
        unitDay: "{n} d",
        emptyValue: "—",
        status_100000000: "Aberta",
        status_100000001: "Em análise",
        status_100000002: "Aguardando aprovação",
        status_100000003: "Em tratativa",
        status_100000004: "Resolvida",
        status_100000005: "Cancelada",
        prioridade_100000000: "Baixa",
        prioridade_100000001: "Média",
        prioridade_100000002: "Alta",
        prioridade_100000003: "Crítica",
        sla_100000000: "No prazo",
        sla_100000001: "Em risco",
        sla_100000002: "Estourado",
        sla_100000003: "Cumprido",
        sla_100000004: "Não cumprido",
    },
};

// ---------- Style helpers ----------

function borderAll(color: string) {
    return {
        borderTopWidth: "1px",
        borderRightWidth: "1px",
        borderBottomWidth: "1px",
        borderLeftWidth: "1px",
        borderTopStyle: "solid",
        borderRightStyle: "solid",
        borderBottomStyle: "solid",
        borderLeftStyle: "solid",
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: color,
    } as const;
}

function themeToVars(theme: Record<string, string | number>): CSSProperties {
    const vars: Record<string, string> = {};
    Object.keys(theme).forEach((key) => {
        vars[`--${key}`] = String(theme[key]);
    });
    return vars as CSSProperties;
}

// Tema sempre claro + cor principal azul petróleo + Poppins em todos os componentes Fluent.
const BRAND_VARS: Record<string, string> = {
    fontFamilyBase: FONT_STACK,
    colorNeutralForeground1: NC_TEXT,
    colorBrandBackground: NC_PRIMARY,
    colorBrandBackgroundHover: NC_PRIMARY_HOVER,
    colorBrandBackgroundPressed: NC_PRIMARY_PRESSED,
    colorBrandBackgroundSelected: NC_PRIMARY_HOVER,
    colorBrandBackground2: NC_TINT,
    colorBrandForeground1: NC_PRIMARY,
    colorBrandForeground2: NC_DARK,
    colorBrandForegroundLink: NC_PRIMARY,
    colorBrandForegroundLinkHover: NC_PRIMARY_HOVER,
    colorBrandForegroundLinkPressed: NC_PRIMARY_PRESSED,
    colorBrandStroke1: NC_PRIMARY,
    colorCompoundBrandForeground1: NC_PRIMARY,
    colorCompoundBrandForeground1Hover: NC_PRIMARY_HOVER,
    colorCompoundBrandForeground1Pressed: NC_PRIMARY_PRESSED,
    colorCompoundBrandBackground: NC_PRIMARY,
    colorCompoundBrandBackgroundHover: NC_PRIMARY_HOVER,
    colorCompoundBrandBackgroundPressed: NC_PRIMARY_PRESSED,
    colorCompoundBrandStroke: NC_PRIMARY,
    colorCompoundBrandStrokeHover: NC_PRIMARY_HOVER,
    colorCompoundBrandStrokePressed: NC_PRIMARY_PRESSED,
    colorNeutralForeground2BrandHover: NC_PRIMARY,
    colorNeutralForeground2BrandPressed: NC_PRIMARY_PRESSED,
    colorNeutralForeground2BrandSelected: NC_PRIMARY,
    colorNeutralForeground3BrandHover: NC_PRIMARY,
    colorNeutralForeground3BrandPressed: NC_PRIMARY_PRESSED,
    colorNeutralForeground3BrandSelected: NC_PRIMARY,
};

const OUTER_STYLE: CSSProperties = {
    ...themeToVars(webLightTheme as unknown as Record<string, string | number>),
    ...themeToVars(BRAND_VARS),
    height: "100%",
    overflow: "hidden",
};

// Foco visível em branco sobre a faixa azul petróleo.
const HERO_VARS: CSSProperties = themeToVars({
    colorStrokeFocus1: NC_PRIMARY,
    colorStrokeFocus2: NC_WHITE,
});

// Cabeçalho da tabela em #005979 com texto branco (hover, pressionado e foco coerentes).
const GRID_HEADER_VARS: CSSProperties = themeToVars({
    colorNeutralForeground1: NC_WHITE,
    colorNeutralForeground2: NC_WHITE,
    colorSubtleBackgroundHover: NC_PRIMARY_HOVER,
    colorSubtleBackgroundPressed: NC_PRIMARY_PRESSED,
    colorNeutralStroke2: NC_PRIMARY,
    colorStrokeFocus1: NC_PRIMARY,
    colorStrokeFocus2: NC_WHITE,
});

// ---------- Styles ----------

const useStyles = makeStyles({
    root: {
        position: "relative",
        contain: "layout",
        boxSizing: "border-box",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        alignContent: "start",
        rowGap: tokens.spacingVerticalXXL,
        paddingTop: tokens.spacingVerticalXL,
        paddingBottom: tokens.spacingVerticalXXXL,
        paddingInlineStart: tokens.spacingHorizontalXXL,
        paddingInlineEnd: tokens.spacingHorizontalXXL,
        backgroundColor: NC_PAGE_BG,
        color: NC_TEXT,
        fontFamily: FONT_STACK,
        "@media (max-width: 768px)": {
            rowGap: tokens.spacingVerticalXL,
            paddingTop: tokens.spacingVerticalL,
            paddingInlineStart: tokens.spacingHorizontalM,
            paddingInlineEnd: tokens.spacingHorizontalM,
        },
    },
    srOnly: {
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clipPath: "inset(50%)",
        whiteSpace: "nowrap",
    },
    // ----- Faixa azul petróleo (hero) -----
    hero: {
        boxSizing: "border-box",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalXXL,
        backgroundColor: NC_PRIMARY,
        color: NC_WHITE,
        borderRadius: tokens.borderRadiusXLarge,
        boxShadow: NC_HERO_SHADOW,
        paddingTop: "2rem",
        paddingBottom: "2rem",
        paddingInlineStart: "2.25rem",
        paddingInlineEnd: "2.25rem",
        "@media (max-width: 768px)": {
            rowGap: tokens.spacingVerticalL,
            paddingTop: "1.25rem",
            paddingBottom: "1.25rem",
            paddingInlineStart: "1.25rem",
            paddingInlineEnd: "1.25rem",
        },
    },
    heroTop: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalL,
    },
    heroText: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalS,
        minWidth: 0,
    },
    heroTitle: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: "4.25rem",
        lineHeight: "1.02",
        fontWeight: 800,
        letterSpacing: "0.02em",
        color: NC_HERO_TITLE,
        "@media (max-width: 768px)": {
            fontSize: "3.25rem",
        },
        "@media (max-width: 480px)": {
            fontSize: "2.5rem",
        },
    },
    heroSubtitle: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: "1.5rem",
        lineHeight: "1.3",
        fontWeight: 600,
        color: NC_WHITE,
        "@media (max-width: 480px)": {
            fontSize: "1.2rem",
        },
    },
    heroTagline: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase400,
        lineHeight: tokens.lineHeightBase400,
        fontWeight: 400,
        color: NC_WHITE,
    },
    heroActions: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
    },
    heroMeta: {
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase200,
        lineHeight: tokens.lineHeightBase200,
        color: NC_WHITE,
    },
    heroButton: {
        fontFamily: FONT_STACK,
        color: NC_WHITE,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        ...borderAll("rgba(255, 255, 255, 0.6)"),
        ":hover": {
            color: NC_WHITE,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            ...borderAll(NC_WHITE),
        },
        ":hover:active": {
            color: NC_WHITE,
            backgroundColor: "rgba(255, 255, 255, 0.26)",
            ...borderAll(NC_WHITE),
        },
    },
    heroButtonDisabled: {
        opacity: "0.65",
    },
    heroLoading: {
        display: "flex",
        justifyContent: "center",
        paddingTop: tokens.spacingVerticalL,
        paddingBottom: tokens.spacingVerticalL,
    },
    kpiGrid: {
        listStyleType: "none",
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingInlineStart: 0,
        paddingInlineEnd: 0,
        display: "grid",
        gap: tokens.spacingHorizontalM,
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        "@media (max-width: 1360px)": {
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        },
        "@media (max-width: 640px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        },
        "@media (max-width: 360px)": {
            gridTemplateColumns: "minmax(0, 1fr)",
        },
    },
    kpiTile: {
        boxSizing: "border-box",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalXS,
        backgroundColor: NC_GLASS_BG,
        ...borderAll(NC_GLASS_BORDER),
        borderRadius: tokens.borderRadiusLarge,
        color: NC_WHITE,
        paddingTop: tokens.spacingVerticalM,
        paddingBottom: tokens.spacingVerticalM,
        paddingInlineStart: tokens.spacingHorizontalL,
        paddingInlineEnd: tokens.spacingHorizontalL,
    },
    kpiTop: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
    },
    kpiLabel: {
        marginTop: 0,
        marginBottom: 0,
        minWidth: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase300,
        lineHeight: tokens.lineHeightBase300,
        fontWeight: 500,
        color: NC_WHITE,
    },
    kpiIcon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "1.25rem",
        color: NC_WHITE,
    },
    kpiValue: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: "2.25rem",
        lineHeight: "1.15",
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color: NC_WHITE,
    },
    kpiCaption: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase200,
        lineHeight: tokens.lineHeightBase200,
        color: NC_WHITE,
    },
    // ----- Seções sobre o fundo claro -----
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
        minWidth: 0,
    },
    sectionHeader: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalXXS,
    },
    sectionTitle: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase500,
        lineHeight: tokens.lineHeightBase500,
        fontWeight: 700,
        color: NC_TEXT,
    },
    sectionAccent: {
        display: "inline-block",
        flexShrink: 0,
        width: "0.3rem",
        height: "1.25em",
        borderRadius: tokens.borderRadiusSmall,
        backgroundColor: NC_DARK,
    },
    mutedText: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase200,
        lineHeight: tokens.lineHeightBase200,
        color: NC_TEXT_MUTED,
    },
    card: {
        boxSizing: "border-box",
        minWidth: 0,
        overflow: "hidden",
        backgroundColor: NC_WHITE,
        color: NC_TEXT,
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: NC_CARD_SHADOW,
    },
    chartsGrid: {
        display: "grid",
        gap: tokens.spacingHorizontalL,
        gridTemplateColumns: "repeat(auto-fit, minmax(17rem, 1fr))",
        alignItems: "start",
    },
    chartCard: {
        display: "flex",
        flexDirection: "column",
    },
    cardBand: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        backgroundColor: NC_PRIMARY,
        color: NC_WHITE,
        paddingTop: tokens.spacingVerticalM,
        paddingBottom: tokens.spacingVerticalM,
        paddingInlineStart: tokens.spacingHorizontalL,
        paddingInlineEnd: tokens.spacingHorizontalL,
    },
    cardBandIcon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "1.25rem",
        color: NC_WHITE,
    },
    cardBandTitle: {
        flexGrow: 1,
        minWidth: 0,
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase400,
        lineHeight: tokens.lineHeightBase400,
        fontWeight: 600,
        color: NC_WHITE,
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalS,
        paddingTop: tokens.spacingVerticalM,
        paddingBottom: tokens.spacingVerticalL,
        paddingInlineStart: tokens.spacingHorizontalM,
        paddingInlineEnd: tokens.spacingHorizontalM,
    },
    // ----- Barras horizontais -----
    barList: {
        listStyleType: "none",
        marginTop: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingInlineStart: 0,
        paddingInlineEnd: 0,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalXXS,
    },
    barButton: {
        display: "block",
        width: "100%",
        boxSizing: "border-box",
        textAlign: "start",
        cursor: "pointer",
        backgroundColor: "transparent",
        color: NC_TEXT,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase300,
        lineHeight: tokens.lineHeightBase300,
        borderTopStyle: "none",
        borderRightStyle: "none",
        borderBottomStyle: "none",
        borderLeftStyle: "none",
        borderRadius: tokens.borderRadiusMedium,
        paddingTop: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalS,
        paddingInlineStart: tokens.spacingHorizontalS,
        paddingInlineEnd: tokens.spacingHorizontalS,
        ":hover": {
            backgroundColor: NC_TINT,
        },
        ":active": {
            backgroundColor: NC_TINT_STRONG,
        },
        ":focus-visible": {
            outlineStyle: "solid",
            outlineWidth: "2px",
            outlineColor: NC_PRIMARY,
            outlineOffset: "1px",
        },
    },
    barButtonSelected: {
        backgroundColor: NC_TINT,
        boxShadow: `inset 0 0 0 2px ${NC_PRIMARY}`,
    },
    barHeader: {
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        marginBottom: tokens.spacingVerticalXXS,
    },
    barLabel: {
        display: "block",
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    barCount: {
        flexShrink: 0,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
    },
    barPct: {
        fontWeight: 400,
        color: NC_TEXT_MUTED,
    },
    barTrack: {
        display: "block",
        width: "100%",
        height: "0.625rem",
        overflow: "hidden",
        borderRadius: tokens.borderRadiusCircular,
        backgroundColor: NC_TRACK,
    },
    barFill: {
        display: "block",
        height: "100%",
        borderRadius: tokens.borderRadiusCircular,
    },
    fillPrimary: {
        backgroundColor: NC_PRIMARY,
    },
    fillCritical: {
        backgroundColor: NC_RED,
    },
    fillHigh: {
        backgroundColor: NC_ORANGE,
    },
    fillMedium: {
        backgroundColor: NC_ACCENT,
    },
    fillNeutral: {
        backgroundColor: NC_GRAY,
    },
    moreButton: {
        alignSelf: "flex-start",
    },
    emptyText: {
        marginTop: 0,
        marginBottom: 0,
        paddingTop: tokens.spacingVerticalM,
        paddingBottom: tokens.spacingVerticalM,
        paddingInlineStart: tokens.spacingHorizontalS,
        paddingInlineEnd: tokens.spacingHorizontalS,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase300,
        lineHeight: tokens.lineHeightBase300,
        color: NC_TEXT_MUTED,
    },
    // ----- Tabela -----
    tableCard: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
        paddingTop: tokens.spacingVerticalL,
        paddingBottom: tokens.spacingVerticalL,
        paddingInlineStart: tokens.spacingHorizontalXL,
        paddingInlineEnd: tokens.spacingHorizontalXL,
        "@media (max-width: 768px)": {
            paddingInlineStart: tokens.spacingHorizontalM,
            paddingInlineEnd: tokens.spacingHorizontalM,
        },
    },
    tableHeader: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalL,
    },
    tableTitleWrap: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
    },
    tableTitleIcon: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: "1.375rem",
        paddingTop: tokens.spacingVerticalXXS,
        color: NC_PRIMARY,
    },
    tableTitleText: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalXXS,
        minWidth: 0,
    },
    tableTitle: {
        marginTop: 0,
        marginBottom: 0,
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase500,
        lineHeight: tokens.lineHeightBase500,
        fontWeight: 700,
        color: NC_TEXT,
    },
    toolbar: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
    },
    search: {
        flexGrow: 1,
        minWidth: "14rem",
        maxWidth: "24rem",
        "@media (max-width: 480px)": {
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
        },
    },
    dropdown: {
        minWidth: "13rem",
        "@media (max-width: 480px)": {
            minWidth: 0,
            width: "100%",
        },
    },
    chips: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    tableScroll: {
        width: "100%",
        overflowX: "auto",
    },
    gridHeader: {
        backgroundColor: NC_PRIMARY,
        color: NC_WHITE,
        borderTopLeftRadius: tokens.borderRadiusMedium,
        borderTopRightRadius: tokens.borderRadiusMedium,
    },
    gridHeaderCell: {
        fontFamily: FONT_STACK,
        fontWeight: 600,
        color: NC_WHITE,
    },
    cellLayout: {
        minWidth: 0,
        overflow: "hidden",
    },
    cellText: {
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    mutedCell: {
        color: NC_TEXT_MUTED,
    },
    protocolLink: {
        display: "inline-block",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textAlign: "start",
        fontFamily: FONT_STACK,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
    },
    prazoText: {
        fontVariantNumeric: "tabular-nums",
    },
    overdueText: {
        color: NC_RED,
        fontWeight: 600,
    },
    centerState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        rowGap: tokens.spacingVerticalS,
        paddingTop: tokens.spacingVerticalXXXL,
        paddingBottom: tokens.spacingVerticalXXXL,
        textAlign: "center",
        fontFamily: FONT_STACK,
        fontSize: tokens.fontSizeBase300,
        color: NC_TEXT_MUTED,
    },
});

// ---------- Utilities ----------

function getXrm(): XrmLike | undefined {
    return (window as unknown as { Xrm?: XrmLike }).Xrm;
}

function detectLanguage(): LanguageInfo {
    try {
        const languageId = getXrm()?.Utility?.getGlobalContext?.()?.userSettings?.languageId;
        if (typeof languageId === "number" && LANGUAGES[languageId]) {
            return LANGUAGES[languageId];
        }
    } catch (err) {
        console.error("Falha ao detectar o idioma do usuário", err);
    }
    return DEFAULT_LANGUAGE;
}

function getCurrentUserId(): string | undefined {
    try {
        const userId = getXrm()?.Utility?.getGlobalContext?.()?.userSettings?.userId;
        if (typeof userId !== "string" || !userId) return undefined;
        return userId.replace("{", "").replace("}", "").toLowerCase();
    } catch (err) {
        console.error("Falha ao obter o usuário atual", err);
        return undefined;
    }
}

function fill(template: string, values: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match: string, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name) ? values[name] : match,
    );
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function toODataDateTime(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "string" || typeof value === "number") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
}

function lookupId(value: unknown): string | undefined {
    if (typeof value !== "string" || value.trim() === "") return undefined;
    const match = /\(([^)]+)\)/.exec(value);
    return (match ? match[1] : value).toLowerCase();
}

function formattedValue(row: ODataRow, field: string): string | undefined {
    const value = row[`${field}${FORMATTED}`];
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function choiceLabel(row: ODataRow, field: string, value: number | undefined, prefix: string, t: Translate, fallback: string): string {
    if (value === undefined) return fallback;
    const formatted = formattedValue(row, field);
    if (formatted) return formatted;
    const key = `${prefix}_${value}`;
    const translated = t(key);
    return translated === key ? String(value) : translated;
}

async function collectRows<T extends { nc_ocorrenciaid?: string }>(first: PagedResult, maxRows: number): Promise<{ rows: T[]; truncated: boolean }> {
    const byId = new Map<string, T>();
    const withoutId: T[] = [];
    const add = (list: unknown[] | undefined) => {
        (list ?? []).forEach((item) => {
            const row = item as T;
            const id = row.nc_ocorrenciaid;
            if (typeof id === "string" && id) {
                byId.set(id, row);
            } else {
                withoutId.push(row);
            }
        });
    };
    add(first.rows);
    let page: PagedResult = first;
    let guard = 0;
    while (page.hasMoreRows && typeof page.loadMoreRows === "function" && byId.size + withoutId.length < maxRows && guard < 50) {
        page = await page.loadMoreRows();
        add(page.rows);
        guard += 1;
    }
    const all = Array.from(byId.values()).concat(withoutId);
    return { rows: all.slice(0, maxRows), truncated: !!page.hasMoreRows || all.length > maxRows };
}

async function fetchDashboard(api: DataApi): Promise<DashboardData> {
    const monthStart = startOfMonth(new Date());
    const [open, resolved] = await Promise.all([
        api
            .queryTable("nc_ocorrencia", {
                select: [
                    "nc_ocorrenciaid",
                    "nc_protocolo",
                    "nc_status",
                    "nc_prioridade",
                    "nc_situacaosla",
                    "nc_prazosolucao",
                    "_nc_motivoid_value",
                    "_nc_transportadoraid_value",
                ],
                filter: `nc_status ne ${STATUS_RESOLVIDA} and nc_status ne ${STATUS_CANCELADA}`,
                orderBy: "nc_prazosolucao asc",
                pageSize: PAGE_SIZE,
            })
            .then((first) => collectRows<OpenRow>(first as unknown as PagedResult, MAX_OPEN_ROWS)),
        api
            .queryTable("nc_ocorrencia", {
                select: ["nc_ocorrenciaid", "nc_situacaosla"],
                filter: `nc_status eq ${STATUS_RESOLVIDA} and nc_dataresolucao ge ${toODataDateTime(monthStart)}`,
                pageSize: PAGE_SIZE,
            })
            .then((first) => collectRows<ResolvedRow>(first as unknown as PagedResult, MAX_RESOLVED_ROWS)),
    ]);
    return {
        open: open.rows,
        resolvedMonth: resolved.rows,
        openTruncated: open.truncated,
        resolvedTruncated: resolved.truncated,
        monthStart: monthStart.getTime(),
        loadedAt: Date.now(),
    };
}

function readFreshDashboard(): DashboardData | null {
    const cached = winAny[CACHE_KEY] as DashboardData | undefined;
    if (!cached || typeof cached.loadedAt !== "number") return null;
    if (Date.now() - cached.loadedAt > CACHE_TTL_MS) return null;
    if (cached.monthStart !== startOfMonth(new Date()).getTime()) return null;
    return cached;
}

function toOpenItem(row: OpenRow, index: number, t: Translate): OpenItem {
    const status = toNumber(row.nc_status);
    const prioridade = toNumber(row.nc_prioridade);
    const sla = toNumber(row.nc_situacaosla);
    const motivoId = lookupId(row._nc_motivoid_value);
    const transportadoraId = lookupId(row._nc_transportadoraid_value);
    const knownPrioridade = prioridade !== undefined && PRIORIDADE_ORDER.indexOf(prioridade) >= 0;
    const protocolo = typeof row.nc_protocolo === "string" ? row.nc_protocolo.trim() : "";
    return {
        id: typeof row.nc_ocorrenciaid === "string" && row.nc_ocorrenciaid ? row.nc_ocorrenciaid : `row-${index}`,
        protocolo,
        status,
        statusLabel: choiceLabel(row, "nc_status", status, "status", t, t("emptyValue")),
        prioridade,
        prioridadeKey: knownPrioridade ? String(prioridade) : NONE_KEY,
        prioridadeLabel: knownPrioridade ? t(`prioridade_${prioridade}`) : t("noPrioridade"),
        sla,
        slaLabel: choiceLabel(row, "nc_situacaosla", sla, "sla", t, t("emptyValue")),
        prazo: toDate(row.nc_prazosolucao),
        motivoKey: motivoId ?? NONE_KEY,
        motivoLabel: motivoId ? formattedValue(row, "_nc_motivoid_value") ?? t("unnamedRecord") : t("noMotivo"),
        transportadoraKey: transportadoraId ?? NONE_KEY,
        transportadoraLabel: transportadoraId
            ? formattedValue(row, "_nc_transportadoraid_value") ?? t("unnamedRecord")
            : t("noTransportadora"),
    };
}

function groupBars(items: OpenItem[], keyOf: (item: OpenItem) => string, labelOf: (item: OpenItem) => string): BarDatum[] {
    const map = new Map<string, BarDatum>();
    items.forEach((item) => {
        const key = keyOf(item);
        const existing = map.get(key);
        if (existing) {
            existing.count += 1;
        } else {
            map.set(key, { key, label: labelOf(item), count: 1, tone: key === NONE_KEY ? "neutral" : "primary" });
        }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function prioridadeTone(value: number): BarTone {
    if (value === PRIORIDADE_CRITICA) return "critical";
    if (value === PRIORIDADE_ALTA) return "high";
    if (value === PRIORIDADE_MEDIA) return "medium";
    return "neutral";
}

function statusBadgeColor(value?: number): BadgeColor {
    switch (value) {
        case STATUS_ABERTA:
            return "brand";
        case STATUS_AGUARDANDO_APROVACAO:
            return "warning";
        case STATUS_EM_ANALISE:
        case STATUS_EM_TRATATIVA:
            return "informative";
        default:
            return "subtle";
    }
}

function prioridadeBadgeColor(value?: number): BadgeColor {
    switch (value) {
        case PRIORIDADE_CRITICA:
            return "danger";
        case PRIORIDADE_ALTA:
            return "severe";
        case PRIORIDADE_MEDIA:
            return "informative";
        default:
            return "subtle";
    }
}

function slaBadgeColor(value?: number): BadgeColor {
    switch (value) {
        case SLA_NO_PRAZO:
        case SLA_CUMPRIDO:
            return "success";
        case SLA_EM_RISCO:
            return "warning";
        case SLA_ESTOURADO:
        case SLA_NAO_CUMPRIDO:
            return "danger";
        default:
            return "subtle";
    }
}

function slaRank(value?: number): number {
    if (value === SLA_ESTOURADO) return 3;
    if (value === SLA_EM_RISCO) return 2;
    if (value === SLA_NO_PRAZO) return 1;
    return 0;
}

function prazoTime(item: OpenItem): number {
    return item.prazo ? item.prazo.getTime() : Number.POSITIVE_INFINITY;
}

function compareByPrazo(a: OpenItem, b: OpenItem): number {
    const at = prazoTime(a);
    const bt = prazoTime(b);
    if (at !== bt) return at < bt ? -1 : 1;
    return (b.prioridade ?? 0) - (a.prioridade ?? 0);
}

function formatNumberWith(settings: UserSettingsRow | null, locale: string, value: number): string {
    if (!Number.isFinite(value)) return "";
    if (!settings?.decimalsymbol || !settings?.numberseparator) {
        return value.toLocaleString(locale);
    }
    const negative = value < 0;
    const [intPart, decPart] = Math.abs(value).toString().split(".");
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.numberseparator);
    const body = decPart ? `${grouped}${settings.decimalsymbol}${decPart}` : grouped;
    return negative ? `-${body}` : body;
}

function formatDateWith(settings: UserSettingsRow | null, locale: string, date: Date): string {
    const fmt = settings?.dateformatstring;
    const sep = settings?.dateseparator;
    if (!fmt || !sep) return date.toLocaleDateString(locale);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return fmt
        .replace(/[/\-.]/g, sep)
        .replace(/yyyy|yy|MM|M|dd|d/g, (token: string) => {
            switch (token) {
                case "yyyy":
                    return String(year);
                case "yy":
                    return String(year).slice(-2);
                case "MM":
                    return String(month).padStart(2, "0");
                case "M":
                    return String(month);
                case "dd":
                    return String(day).padStart(2, "0");
                case "d":
                    return String(day);
                default:
                    return token;
            }
        });
}

function formatTimeWith(locale: string, date: Date): string {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function relativeDue(prazo: Date, now: number, t: Translate, formatNumber: NumberFormatter): { text: string; overdue: boolean } {
    const diffMinutes = Math.round((prazo.getTime() - now) / 60000);
    const absolute = Math.abs(diffMinutes);
    if (absolute < 1) return { text: t("dueNow"), overdue: false };
    let amount: string;
    if (absolute < 60) {
        amount = fill(t("unitMin"), { n: formatNumber(absolute) });
    } else if (absolute < 48 * 60) {
        amount = fill(t("unitHour"), { n: formatNumber(Math.floor(absolute / 60)) });
    } else {
        amount = fill(t("unitDay"), { n: formatNumber(Math.floor(absolute / 1440)) });
    }
    const overdue = diffMinutes < 0;
    return { text: fill(t(overdue ? "overdueBy" : "dueIn"), { v: amount }), overdue };
}

// ---------- Sub-components ----------

type KpiTileProps = {
    label: string;
    value: string;
    caption: string;
    icon: ReactElement;
};

function KpiTile(props: KpiTileProps) {
    const styles = useStyles();
    return (
        <li className={styles.kpiTile}>
            <div className={styles.kpiTop}>
                <p className={styles.kpiLabel}>{props.label}</p>
                <span className={styles.kpiIcon} aria-hidden="true">
                    {props.icon}
                </span>
            </div>
            <p className={styles.kpiValue}>{props.value}</p>
            <p className={styles.kpiCaption}>{props.caption}</p>
        </li>
    );
}

type BarListProps = {
    headingId: string;
    title: string;
    icon: ReactElement;
    data: BarDatum[];
    total: number;
    selectedKey: string | null;
    maxVisible: number;
    emptyText: string;
    onToggle: (datum: BarDatum) => void;
    t: Translate;
    formatNumber: NumberFormatter;
    formatPercent: NumberFormatter;
};

function BarList(props: BarListProps) {
    const styles = useStyles();
    const [expanded, setExpanded] = useState(false);
    const { data, total, selectedKey, maxVisible, t, formatNumber, formatPercent } = props;

    const maxCount = data.reduce((max, d) => Math.max(max, d.count), 0);
    const visible = expanded ? data : data.slice(0, maxVisible);
    const selectedHidden = !expanded && selectedKey !== null && !visible.some((d) => d.key === selectedKey);
    const shown = selectedHidden ? visible.concat(data.filter((d) => d.key === selectedKey)) : visible;
    const hasMore = data.length > maxVisible;

    return (
        <section className={mergeClasses(styles.card, styles.chartCard)} aria-labelledby={props.headingId}>
            <div className={styles.cardBand}>
                <span className={styles.cardBandIcon} aria-hidden="true">
                    {props.icon}
                </span>
                <h3 id={props.headingId} className={styles.cardBandTitle}>
                    {props.title}
                </h3>
            </div>
            <div className={styles.cardBody}>
                {data.length === 0 ? (
                    <p className={styles.emptyText}>{props.emptyText}</p>
                ) : (
                    <ul className={styles.barList}>
                        {shown.map((d) => {
                            const selected = d.key === selectedKey;
                            const ratio = total > 0 ? d.count / total : 0;
                            const pctText = formatPercent(ratio);
                            const widthPct = maxCount > 0 ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 2 : 0) : 0;
                            const toneClass =
                                d.tone === "critical"
                                    ? styles.fillCritical
                                    : d.tone === "high"
                                    ? styles.fillHigh
                                    : d.tone === "medium"
                                    ? styles.fillMedium
                                    : d.tone === "neutral"
                                    ? styles.fillNeutral
                                    : styles.fillPrimary;
                            const ariaLabel = fill(t(selected ? "barAriaSelected" : "barAria"), {
                                label: d.label,
                                count: formatNumber(d.count),
                                pct: pctText,
                            });
                            return (
                                <li key={d.key}>
                                    <button
                                        type="button"
                                        className={mergeClasses(styles.barButton, selected && styles.barButtonSelected)}
                                        aria-pressed={selected}
                                        aria-label={ariaLabel}
                                        title={d.label}
                                        onClick={() => props.onToggle(d)}
                                    >
                                        <span className={styles.barHeader}>
                                            <span className={styles.barLabel}>{d.label}</span>
                                            <span className={styles.barCount}>
                                                {formatNumber(d.count)} <span className={styles.barPct}>({pctText})</span>
                                            </span>
                                        </span>
                                        <span className={styles.barTrack} aria-hidden="true">
                                            <span className={mergeClasses(styles.barFill, toneClass)} style={{ width: `${widthPct}%` }} />
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {hasMore && (
                    <Button
                        className={styles.moreButton}
                        appearance="transparent"
                        size="small"
                        aria-expanded={expanded}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {expanded ? t("showLess") : fill(t("showAll"), { n: formatNumber(data.length) })}
                    </Button>
                )}
            </div>
        </section>
    );
}

// ---------- Page ----------

const GeneratedComponent = (props: PageProps) => {
    const { dataApi, pageInput } = props;
    void pageInput; // home dashboard takes no page input; destructured per rules
    const styles = useStyles();

    const language = useMemo(() => detectLanguage(), []);
    const dictionary = translations[language.code] ?? translations[DEFAULT_LANGUAGE.code];
    const t: Translate = (key) => dictionary[key] ?? translations[DEFAULT_LANGUAGE.code][key] ?? key;

    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
    const setContainer = useCallback((node: HTMLDivElement | null) => setMountNode(node), []);

    const [userSettings, setUserSettings] = useState<UserSettingsRow | null>(
        () => (winAny[SETTINGS_KEY] as UserSettingsRow | undefined) ?? null,
    );
    const [state, setState] = useState<LoadState>(() => {
        const cached = readFreshDashboard();
        return { dashboard: cached, loading: cached === null, refreshing: false, error: false };
    });
    const [reloadKey, setReloadKey] = useState(0);
    const [search, setSearch] = useState("");
    const [slaFilter, setSlaFilter] = useState<string>("all");
    const [drill, setDrill] = useState<Drill>({});
    const [navError, setNavError] = useState(false);
    const [now, setNow] = useState<number>(() => Date.now());

    const kpiHeadingId = useId("kpi-heading");
    const chartsHeadingId = useId("charts-heading");
    const chartsHintId = useId("charts-hint");
    const motivoHeadingId = useId("motivo-heading");
    const transportadoraHeadingId = useId("transportadora-heading");
    const prioridadeHeadingId = useId("prioridade-heading");
    const tableHeadingId = useId("table-heading");
    const tableDescId = useId("table-desc");

    const dataReady = !!dataApi;

    // Keep relative due times ("vence em 2 h") current while the page stays open.
    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    // User formatting preferences (usersettings) — de-duped + cached on window.
    useEffect(() => {
        if (!dataReady) return undefined;
        const cached = winAny[SETTINGS_KEY] as UserSettingsRow | undefined;
        if (cached !== undefined) {
            if (userSettings !== cached) setUserSettings(cached);
            return undefined;
        }
        const userId = getCurrentUserId();
        if (!userId) return undefined;
        let cancelled = false;

        let pending = winAny[SETTINGS_INFLIGHT_KEY] as Promise<UserSettingsRow> | undefined;
        if (!pending) {
            try {
                const settingsApi = dataApi as unknown as SettingsApi;
                pending = settingsApi
                    .retrieveRow("usersettings", {
                        id: userId,
                        select: [
                            "uilanguageid",
                            "localeid",
                            "decimalsymbol",
                            "numberseparator",
                            "currencysymbol",
                            "dateformatstring",
                            "dateseparator",
                        ],
                    })
                    .then((row) => {
                        winAny[SETTINGS_KEY] = row;
                        return row;
                    })
                    .finally(() => {
                        if (winAny[SETTINGS_INFLIGHT_KEY] === pending) delete winAny[SETTINGS_INFLIGHT_KEY];
                    });
                winAny[SETTINGS_INFLIGHT_KEY] = pending;
            } catch (err) {
                console.error("Falha ao carregar as configurações do usuário", err);
                return undefined;
            }
        }

        pending
            .then((row) => {
                if (!cancelled) setUserSettings(row);
            })
            .catch((err: unknown) => {
                if (!cancelled) console.error("Falha ao carregar as configurações do usuário", err);
            });

        return () => {
            cancelled = true;
        };
        // Readiness only — never `dataApi` (new reference every render).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady]);

    // Dashboard data — in-flight de-dupe + short-lived window cache.
    useEffect(() => {
        if (!dataReady) return undefined;

        const fresh = readFreshDashboard();
        if (fresh) {
            if (state.dashboard !== fresh || state.loading || state.refreshing) {
                setState({ dashboard: fresh, loading: false, refreshing: false, error: false });
            }
            return undefined;
        }
        if (winAny[CACHE_KEY] !== undefined) delete winAny[CACHE_KEY];
        let cancelled = false;

        let inflight = winAny[INFLIGHT_KEY] as Promise<DashboardData> | undefined;
        if (!inflight) {
            try {
                inflight = fetchDashboard(dataApi)
                    .then((result) => {
                        winAny[CACHE_KEY] = result;
                        return result;
                    })
                    .finally(() => {
                        if (winAny[INFLIGHT_KEY] === inflight) delete winAny[INFLIGHT_KEY];
                    });
                winAny[INFLIGHT_KEY] = inflight;
            } catch (err) {
                console.error("Falha ao carregar o Painel da Central", err);
                setState((prev) => ({ dashboard: prev.dashboard, loading: false, refreshing: false, error: true }));
                return undefined;
            }
        }

        inflight
            .then((result) => {
                if (!cancelled) setState({ dashboard: result, loading: false, refreshing: false, error: false });
            })
            .catch((err: unknown) => {
                console.error("Falha ao carregar o Painel da Central", err);
                if (!cancelled) {
                    setState((prev) => ({ dashboard: prev.dashboard, loading: false, refreshing: false, error: true }));
                }
            });

        return () => {
            cancelled = true;
        };
        // Readiness + explicit reload key only — never `dataApi`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataReady, reloadKey]);

    // ---------- Formatting (driven by usersettings) ----------

    const formatNumber: NumberFormatter = (value) => formatNumberWith(userSettings, language.code, value);
    const formatPercent: NumberFormatter = (ratio) => `${formatNumber(Math.round(ratio * 1000) / 10)}%`;
    const formatDate = (date: Date) => formatDateWith(userSettings, language.code, date);
    const formatTime = (date: Date) => formatTimeWith(language.code, date);

    // ---------- Derived data (all hooks stay above any conditional rendering) ----------

    const dashboard = state.dashboard;

    const items = useMemo<OpenItem[]>(
        () => (dashboard?.open ?? []).map((row, index) => toOpenItem(row, index, t)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dashboard, language.code],
    );

    const kpis = useMemo(() => {
        let novas = 0;
        let risco = 0;
        let estouradas = 0;
        let aprovacao = 0;
        items.forEach((item) => {
            if (item.status === STATUS_ABERTA) novas += 1;
            if (item.status === STATUS_AGUARDANDO_APROVACAO) aprovacao += 1;
            if (item.sla === SLA_EM_RISCO) risco += 1;
            if (item.sla === SLA_ESTOURADO) estouradas += 1;
        });
        const resolved = dashboard?.resolvedMonth ?? [];
        const met = resolved.filter((row) => toNumber(row.nc_situacaosla) === SLA_CUMPRIDO).length;
        return {
            open: items.length,
            novas,
            risco,
            estouradas,
            aprovacao,
            resolvedTotal: resolved.length,
            met,
            ratio: resolved.length > 0 ? met / resolved.length : null,
        };
    }, [items, dashboard]);

    const charts = useMemo(() => {
        const motivo = groupBars(items, (item) => item.motivoKey, (item) => item.motivoLabel);
        const transportadora = groupBars(items, (item) => item.transportadoraKey, (item) => item.transportadoraLabel);
        const prioridade: BarDatum[] = PRIORIDADE_ORDER.map((value) => ({
            key: String(value),
            label: t(`prioridade_${value}`),
            count: items.filter((item) => item.prioridade === value).length,
            tone: prioridadeTone(value),
        }));
        const semPrioridade = items.filter((item) => item.prioridadeKey === NONE_KEY).length;
        if (semPrioridade > 0) {
            prioridade.push({ key: NONE_KEY, label: t("noPrioridade"), count: semPrioridade, tone: "neutral" });
        }
        return { motivo, transportadora, prioridade: items.length > 0 ? prioridade : [] };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, language.code]);

    const table = useMemo(() => {
        const term = search.trim().toLocaleLowerCase(language.code);
        const slaValue = slaFilter === "all" ? null : Number(slaFilter);
        const matched = items.filter((item) => {
            if (slaValue !== null && item.sla !== slaValue) return false;
            if (drill.motivo && item.motivoKey !== drill.motivo.key) return false;
            if (drill.transportadora && item.transportadoraKey !== drill.transportadora.key) return false;
            if (drill.prioridade && item.prioridadeKey !== drill.prioridade.key) return false;
            if (term) {
                const haystack = `${item.protocolo} ${item.motivoLabel} ${item.transportadoraLabel} ${item.statusLabel}`.toLocaleLowerCase(
                    language.code,
                );
                if (haystack.indexOf(term) < 0) return false;
            }
            return true;
        });
        const rows = matched.slice().sort(compareByPrazo).slice(0, TABLE_LIMIT);
        return { rows, matched: matched.length };
    }, [items, search, slaFilter, drill, language.code]);

    // ---------- Handlers ----------

    const handleRefresh = () => {
        delete winAny[CACHE_KEY];
        delete winAny[INFLIGHT_KEY];
        setState((prev) => ({
            dashboard: prev.dashboard,
            loading: prev.dashboard === null,
            refreshing: prev.dashboard !== null,
            error: false,
        }));
        setReloadKey((key) => key + 1);
    };

    const toggleDrill = (dim: DrillDim, datum: BarDatum) => {
        setDrill((prev) => {
            const next: Drill = { ...prev };
            if (prev[dim]?.key === datum.key) {
                delete next[dim];
            } else {
                next[dim] = { key: datum.key, label: datum.label };
            }
            return next;
        });
    };

    const removeDrill = (dim: DrillDim) => {
        setDrill((prev) => {
            const next: Drill = { ...prev };
            delete next[dim];
            return next;
        });
    };

    const clearFilters = () => {
        setDrill({});
        setSlaFilter("all");
        setSearch("");
    };

    const openRecord = (id: string) => {
        const xrm = getXrm();
        if (!id || id.indexOf("row-") === 0 || !xrm?.Navigation || typeof xrm.Navigation.navigateTo !== "function") {
            setNavError(true);
            return;
        }
        try {
            const result = xrm.Navigation.navigateTo({ pageType: "entityrecord", entityName: "nc_ocorrencia", entityId: id });
            const maybePromise = result as Promise<unknown> | undefined;
            if (maybePromise && typeof maybePromise.then === "function") {
                maybePromise.then(undefined, (err: unknown) => {
                    console.error("Falha ao abrir a ocorrência", err);
                    setNavError(true);
                });
            }
        } catch (err) {
            console.error("Falha ao abrir a ocorrência", err);
            setNavError(true);
        }
    };

    // ---------- Table columns ----------

    const columns: TableColumnDefinition<OpenItem>[] = [
        createTableColumn<OpenItem>({
            columnId: "protocolo",
            compare: (a, b) => a.protocolo.localeCompare(b.protocolo, language.code, { numeric: true }),
            renderHeaderCell: () => t("colProtocolo"),
            renderCell: (item) => {
                const text = item.protocolo || t("noProtocolo");
                return (
                    <TableCellLayout className={styles.cellLayout}>
                        <Link
                            as="button"
                            className={styles.protocolLink}
                            title={text}
                            aria-label={fill(t("openRecordAria"), { protocolo: text })}
                            onClick={() => openRecord(item.id)}
                        >
                            {text}
                        </Link>
                    </TableCellLayout>
                );
            },
        }),
        createTableColumn<OpenItem>({
            columnId: "status",
            compare: (a, b) => (a.status ?? 0) - (b.status ?? 0),
            renderHeaderCell: () => t("colStatus"),
            renderCell: (item) => (
                <TableCellLayout className={styles.cellLayout}>
                    <Badge appearance="outline" shape="rounded" color={statusBadgeColor(item.status)}>
                        {item.statusLabel}
                    </Badge>
                </TableCellLayout>
            ),
        }),
        createTableColumn<OpenItem>({
            columnId: "prioridade",
            compare: (a, b) => (a.prioridade ?? 0) - (b.prioridade ?? 0),
            renderHeaderCell: () => t("colPrioridade"),
            renderCell: (item) => (
                <TableCellLayout className={styles.cellLayout}>
                    <Badge appearance="tint" shape="rounded" color={prioridadeBadgeColor(item.prioridade)}>
                        {item.prioridadeLabel}
                    </Badge>
                </TableCellLayout>
            ),
        }),
        createTableColumn<OpenItem>({
            columnId: "sla",
            compare: (a, b) => slaRank(a.sla) - slaRank(b.sla),
            renderHeaderCell: () => t("colSla"),
            renderCell: (item) => (
                <TableCellLayout className={styles.cellLayout}>
                    <Badge appearance="tint" shape="rounded" color={slaBadgeColor(item.sla)}>
                        {item.slaLabel}
                    </Badge>
                </TableCellLayout>
            ),
        }),
        createTableColumn<OpenItem>({
            columnId: "prazo",
            compare: (a, b) => compareByPrazo(a, b),
            renderHeaderCell: () => t("colPrazo"),
            renderCell: (item) => {
                if (!item.prazo) {
                    return (
                        <TableCellLayout className={styles.cellLayout}>
                            <span className={mergeClasses(styles.cellText, styles.mutedCell)}>{t("noPrazo")}</span>
                        </TableCellLayout>
                    );
                }
                const due = relativeDue(item.prazo, now, t, formatNumber);
                return (
                    <TableCellLayout
                        className={styles.cellLayout}
                        description={<span className={due.overdue ? styles.overdueText : undefined}>{due.text}</span>}
                    >
                        <span className={mergeClasses(styles.cellText, styles.prazoText)}>
                            {`${formatDate(item.prazo)} ${formatTime(item.prazo)}`}
                        </span>
                    </TableCellLayout>
                );
            },
        }),
        createTableColumn<OpenItem>({
            columnId: "motivo",
            compare: (a, b) => a.motivoLabel.localeCompare(b.motivoLabel, language.code),
            renderHeaderCell: () => t("colMotivo"),
            renderCell: (item) => (
                <TableCellLayout className={styles.cellLayout}>
                    <span className={styles.cellText} title={item.motivoLabel}>
                        {item.motivoLabel}
                    </span>
                </TableCellLayout>
            ),
        }),
    ];

    // ---------- Render helpers ----------

    const monthName = dashboard ? new Date(dashboard.monthStart).toLocaleDateString(language.code, { month: "long" }) : "";
    const hasDrill = !!(drill.motivo || drill.transportadora || drill.prioridade);
    const hasFilters = hasDrill || slaFilter !== "all" || search.trim() !== "";
    const slaFilterText = slaFilter === "all" ? t("slaAll") : t(`sla_${slaFilter}`);
    const dimLabels: Record<DrillDim, string> = {
        motivo: t("dimMotivo"),
        transportadora: t("dimTransportadora"),
        prioridade: t("dimPrioridade"),
    };
    const drillDims: DrillDim[] = ["motivo", "transportadora", "prioridade"];
    const refreshDisabled = state.loading || state.refreshing || !dataReady;

    return (
        <div style={OUTER_STYLE}>
            <style>{FONT_IMPORT_CSS}</style>
            <div ref={setContainer} className={styles.root} dir={language.isRtl ? "rtl" : "ltr"} lang={language.code}>
                <header className={styles.hero} style={HERO_VARS}>
                    <div className={styles.heroTop}>
                        <div className={styles.heroText}>
                            <h1 className={styles.heroTitle}>{t("brand")}</h1>
                            <p className={styles.heroSubtitle}>{t("heroSubtitle")}</p>
                            <p className={styles.heroTagline}>{t("heroTagline")}</p>
                        </div>
                        <div className={styles.heroActions}>
                            {dashboard && (
                                <span className={styles.heroMeta} aria-live="polite">
                                    {fill(t("updatedAt"), { time: formatTime(new Date(dashboard.loadedAt)) })}
                                </span>
                            )}
                            <Button
                                appearance="secondary"
                                className={mergeClasses(styles.heroButton, refreshDisabled && styles.heroButtonDisabled)}
                                icon={state.refreshing ? <Spinner size="tiny" appearance="inverted" /> : <ArrowClockwiseRegular />}
                                disabled={refreshDisabled}
                                aria-label={t("refreshAria")}
                                onClick={handleRefresh}
                            >
                                {state.refreshing ? t("refreshing") : t("refresh")}
                            </Button>
                        </div>
                    </div>

                    {!dashboard && state.loading && (
                        <div className={styles.heroLoading} role="status">
                            <Spinner appearance="inverted" labelPosition="below" label={dataReady ? t("loading") : t("waitingData")} />
                        </div>
                    )}

                    {dashboard && (
                        <section aria-labelledby={kpiHeadingId}>
                            <h2 id={kpiHeadingId} className={styles.srOnly}>
                                {t("kpiSection")}
                            </h2>
                            <ul className={styles.kpiGrid}>
                                <KpiTile
                                    label={t("kpiOpen")}
                                    value={formatNumber(kpis.open)}
                                    caption={t("kpiOpenHint")}
                                    icon={<TaskListLtrRegular />}
                                />
                                <KpiTile
                                    label={t("kpiNew")}
                                    value={formatNumber(kpis.novas)}
                                    caption={t("kpiNewHint")}
                                    icon={<PeopleQueueRegular />}
                                />
                                <KpiTile
                                    label={t("kpiRisk")}
                                    value={formatNumber(kpis.risco)}
                                    caption={t("kpiRiskHint")}
                                    icon={<WarningRegular />}
                                />
                                <KpiTile
                                    label={t("kpiBreached")}
                                    value={formatNumber(kpis.estouradas)}
                                    caption={t("kpiBreachedHint")}
                                    icon={<ErrorCircleRegular />}
                                />
                                <KpiTile
                                    label={t("kpiApproval")}
                                    value={formatNumber(kpis.aprovacao)}
                                    caption={t("kpiApprovalHint")}
                                    icon={<HourglassHalfRegular />}
                                />
                                <KpiTile
                                    label={t("kpiSla")}
                                    value={kpis.ratio === null ? t("emptyValue") : formatPercent(kpis.ratio)}
                                    caption={
                                        kpis.ratio === null
                                            ? fill(t("kpiSlaEmpty"), { month: monthName })
                                            : fill(t("kpiSlaHint"), {
                                                  met: formatNumber(kpis.met),
                                                  total: formatNumber(kpis.resolvedTotal),
                                                  month: monthName,
                                              })
                                    }
                                    icon={<CheckmarkCircleRegular />}
                                />
                            </ul>
                        </section>
                    )}
                </header>

                {state.error && (
                    <MessageBar intent="error">
                        <MessageBarBody>
                            <MessageBarTitle>{t("errorTitle")}</MessageBarTitle>
                            {t("loadError")}
                        </MessageBarBody>
                        <MessageBarActions>
                            <Button size="small" onClick={handleRefresh} disabled={state.loading || state.refreshing}>
                                {t("retry")}
                            </Button>
                        </MessageBarActions>
                    </MessageBar>
                )}

                {navError && (
                    <MessageBar intent="warning">
                        <MessageBarBody>{t("navError")}</MessageBarBody>
                        <MessageBarActions
                            containerAction={
                                <Button
                                    appearance="transparent"
                                    aria-label={t("dismiss")}
                                    icon={<DismissRegular />}
                                    onClick={() => setNavError(false)}
                                />
                            }
                        />
                    </MessageBar>
                )}

                {dashboard?.openTruncated && (
                    <MessageBar intent="info">
                        <MessageBarBody>{fill(t("truncatedNotice"), { n: formatNumber(dashboard.open.length) })}</MessageBarBody>
                    </MessageBar>
                )}

                {dashboard && (
                    <>
                        <section className={styles.section} aria-labelledby={chartsHeadingId} aria-describedby={chartsHintId}>
                            <div className={styles.sectionHeader}>
                                <h2 id={chartsHeadingId} className={styles.sectionTitle}>
                                    <span className={styles.sectionAccent} aria-hidden="true" />
                                    {t("chartsSection")}
                                </h2>
                                <p id={chartsHintId} className={styles.mutedText}>
                                    {t("chartsHint")}
                                </p>
                            </div>
                            <div className={styles.chartsGrid}>
                                <BarList
                                    headingId={motivoHeadingId}
                                    title={t("byMotivo")}
                                    icon={<TagRegular />}
                                    data={charts.motivo}
                                    total={kpis.open}
                                    selectedKey={drill.motivo?.key ?? null}
                                    maxVisible={BAR_MAX_VISIBLE}
                                    emptyText={t("noOpen")}
                                    onToggle={(datum) => toggleDrill("motivo", datum)}
                                    t={t}
                                    formatNumber={formatNumber}
                                    formatPercent={formatPercent}
                                />
                                <BarList
                                    headingId={transportadoraHeadingId}
                                    title={t("byTransportadora")}
                                    icon={<VehicleTruckProfileRegular />}
                                    data={charts.transportadora}
                                    total={kpis.open}
                                    selectedKey={drill.transportadora?.key ?? null}
                                    maxVisible={BAR_MAX_VISIBLE}
                                    emptyText={t("noOpen")}
                                    onToggle={(datum) => toggleDrill("transportadora", datum)}
                                    t={t}
                                    formatNumber={formatNumber}
                                    formatPercent={formatPercent}
                                />
                                <BarList
                                    headingId={prioridadeHeadingId}
                                    title={t("byPrioridade")}
                                    icon={<FlagRegular />}
                                    data={charts.prioridade}
                                    total={kpis.open}
                                    selectedKey={drill.prioridade?.key ?? null}
                                    maxVisible={BAR_MAX_VISIBLE}
                                    emptyText={t("noOpen")}
                                    onToggle={(datum) => toggleDrill("prioridade", datum)}
                                    t={t}
                                    formatNumber={formatNumber}
                                    formatPercent={formatPercent}
                                />
                            </div>
                        </section>

                        <section
                            className={mergeClasses(styles.card, styles.tableCard)}
                            aria-labelledby={tableHeadingId}
                            aria-describedby={tableDescId}
                        >
                            <div className={styles.tableHeader}>
                                <div className={styles.tableTitleWrap}>
                                    <span className={styles.tableTitleIcon} aria-hidden="true">
                                        <CalendarClockRegular />
                                    </span>
                                    <div className={styles.tableTitleText}>
                                        <h2 id={tableHeadingId} className={styles.tableTitle}>
                                            {t("tableTitle")}
                                        </h2>
                                        <p id={tableDescId} className={styles.mutedText}>
                                            {t("tableSubtitle")}
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.toolbar}>
                                    <SearchBox
                                        className={styles.search}
                                        placeholder={t("searchPlaceholder")}
                                        aria-label={t("searchAria")}
                                        value={search}
                                        contentBefore={<SearchRegular />}
                                        onChange={(_, data) => setSearch(data.value ?? "")}
                                    />
                                    <Dropdown
                                        className={styles.dropdown}
                                        aria-label={t("slaFilterAria")}
                                        value={slaFilterText}
                                        selectedOptions={[slaFilter]}
                                        mountNode={mountNode}
                                        onOptionSelect={(_, data) => setSlaFilter(data.optionValue ?? "all")}
                                    >
                                        <Option value="all">{t("slaAll")}</Option>
                                        {SLA_FILTER_OPTIONS.map((value) => (
                                            <Option key={value} value={String(value)}>
                                                {t(`sla_${value}`)}
                                            </Option>
                                        ))}
                                    </Dropdown>
                                </div>
                            </div>

                            {hasFilters && (
                                <div className={styles.chips} role="group" aria-label={t("activeFilters")}>
                                    {hasDrill && <span className={styles.mutedText}>{t("activeFilters")}</span>}
                                    {drillDims.map((dim) => {
                                        const active = drill[dim];
                                        if (!active) return null;
                                        const chipLabel = `${dimLabels[dim]}: ${active.label}`;
                                        return (
                                            <Button
                                                key={dim}
                                                size="small"
                                                appearance="outline"
                                                shape="circular"
                                                icon={<DismissRegular />}
                                                iconPosition="after"
                                                aria-label={fill(t("removeFilter"), { label: chipLabel })}
                                                onClick={() => removeDrill(dim)}
                                            >
                                                {chipLabel}
                                            </Button>
                                        );
                                    })}
                                    <Button size="small" appearance="subtle" onClick={clearFilters}>
                                        {t("clearFilters")}
                                    </Button>
                                </div>
                            )}

                            <p className={styles.mutedText} aria-live="polite">
                                {hasFilters
                                    ? fill(t("tableCountFiltered"), {
                                          shown: formatNumber(table.rows.length),
                                          matched: formatNumber(table.matched),
                                      })
                                    : fill(t("tableCount"), {
                                          shown: formatNumber(table.rows.length),
                                          total: formatNumber(kpis.open),
                                      })}
                            </p>

                            {table.rows.length === 0 ? (
                                <div className={styles.centerState}>
                                    <span>{items.length === 0 ? t("noOpen") : t("noResults")}</span>
                                </div>
                            ) : (
                                <div className={styles.tableScroll}>
                                    <DataGrid
                                        items={table.rows}
                                        columns={columns}
                                        getRowId={(item: OpenItem) => item.id}
                                        sortable
                                        defaultSortState={{ sortColumn: "prazo", sortDirection: "ascending" }}
                                        resizableColumns
                                        focusMode="composite"
                                        columnSizingOptions={{
                                            protocolo: { defaultWidth: 150, idealWidth: 150, minWidth: 120 },
                                            status: { defaultWidth: 190, idealWidth: 190, minWidth: 140 },
                                            prioridade: { defaultWidth: 120, idealWidth: 120, minWidth: 100 },
                                            sla: { defaultWidth: 160, idealWidth: 160, minWidth: 120 },
                                            prazo: { defaultWidth: 200, idealWidth: 200, minWidth: 160 },
                                            motivo: { defaultWidth: 220, idealWidth: 220, minWidth: 140 },
                                        }}
                                        aria-label={t("gridAria")}
                                    >
                                        <DataGridHeader className={styles.gridHeader} style={GRID_HEADER_VARS}>
                                            <DataGridRow>
                                                {({ renderHeaderCell }) => (
                                                    <DataGridHeaderCell className={styles.gridHeaderCell}>{renderHeaderCell()}</DataGridHeaderCell>
                                                )}
                                            </DataGridRow>
                                        </DataGridHeader>
                                        <DataGridBody<OpenItem>>
                                            {({ item, rowId }) => (
                                                <DataGridRow<OpenItem> key={rowId}>
                                                    {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                                                </DataGridRow>
                                            )}
                                        </DataGridBody>
                                    </DataGrid>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default GeneratedComponent;
