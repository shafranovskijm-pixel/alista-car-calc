import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

export type AgentInfo = {
  agent_director_name: string;
  agent_director_short: string;
  agent_director_lastname: string;
  agent_ogrn: string;
  agent_inn: string;
  agent_address: string;
};

export const ALISTA_AGENT: AgentInfo = {
  agent_director_name: "________________________",
  agent_director_short: "________________",
  agent_director_lastname: "________________",
  agent_ogrn: "____________",
  agent_inn: "2543194698",
  agent_address: "г. Владивосток",
};

export type ContractClient = {
  client_type: "individual" | "company";
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  passport?: string | null;
  birth_date?: string | null;
  passport_issued_by?: string | null;
  passport_issued_date?: string | null;
  company_name?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  director_name?: string | null;
  director_position?: string | null;
};

export type ContractDeal = {
  title?: string | null;
  budget?: number | null;
  sale_price?: number | null;
  currency?: string | null;
};

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("ru-RU");
};

const splitPassport = (raw: string | null | undefined) => {
  if (!raw) return { series: "____", number: "______" };
  const digits = raw.replace(/\D+/g, "");
  if (digits.length >= 10) {
    return { series: digits.slice(0, 4), number: digits.slice(4, 10) };
  }
  return { series: digits.slice(0, 4) || "____", number: digits.slice(4) || "______" };
};

export const buildPrincipalBlock = (
  client: ContractClient,
  override?: "individual" | "company",
) => {
  const kind = override ?? client.client_type;
  if (kind === "company") {
    const dirPos = client.director_position?.trim() || "генерального директора";
    const dirName = client.director_name?.trim() || "____________________";
    const name = client.company_name?.trim() || client.full_name?.trim() || "_______________";
    const inn = client.inn?.trim() || "__________";
    const kpp = client.kpp?.trim() || "_________";
    const ogrn = client.ogrn?.trim() || "_____________";
    const addr = client.address?.trim() || "_____________";
    return `${name} (ИНН: ${inn}, КПП: ${kpp}, ОГРН: ${ogrn}), юридический адрес: ${addr}, в лице ${dirPos.toLowerCase()} ${dirName}, действующего на основании Устава, именуемое в дальнейшем «Принципал», «Заказчик», с одной стороны,`;
  }
  const fio = client.full_name?.trim() || "________________________";
  const birth = fmtDate(client.birth_date) || "__.__.____";
  const p = splitPassport(client.passport);
  const issuedBy = client.passport_issued_by?.trim() || "________________________";
  const issuedDate = fmtDate(client.passport_issued_date) || "__.__.____";
  const addr = client.address?.trim() || "________________________";
  return `Гр. ${fio}, ${birth} г.р., паспорт серии ${p.series} № ${p.number}, выдан ${issuedBy} ${issuedDate}, зарегистрирован по адресу: ${addr}, именуемый в дальнейшем «Принципал», «Заказчик», с одной стороны,`;
};

export type ContractData = {
  contract_no: string;
  contract_date: string;
  client: ContractClient;
  deal?: ContractDeal | null;
  principalType: "individual" | "company";
  agent?: Partial<AgentInfo>;
};

export const buildPlaceholders = (data: ContractData): Record<string, string> => {
  const agent = { ...ALISTA_AGENT, ...(data.agent ?? {}) };
  return {
    contract_no: data.contract_no || "____",
    contract_date: data.contract_date,
    principal_block: buildPrincipalBlock(data.client, data.principalType),
    ...agent,
  };
};

export const renderContractText = (templateText: string, data: ContractData) => {
  const ph = buildPlaceholders(data);
  return templateText.replace(/\{([a-z_]+)\}/g, (_, k) => (k in ph ? ph[k] : `{${k}}`));
};

export const renderContractBlob = async (data: ContractData): Promise<Blob> => {
  const res = await fetch("/templates/alista-contract-v3.docx");
  if (!res.ok) throw new Error("Не удалось загрузить шаблон договора");
  const buf = await res.arrayBuffer();
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });
  doc.render(buildPlaceholders(data));
  return doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const downloadBlob = (blob: Blob, fileName: string) => saveAs(blob, fileName);

export const generateContractDocx = async (data: ContractData, fileName?: string) => {
  const blob = await renderContractBlob(data);
  const safeName = (fileName ?? `Договор Алиста ${data.contract_no || ""}`).trim();
  saveAs(blob, `${safeName}.docx`);
};

/**
 * Простой генератор номера договора в формате АЛ-YYYYMMDD-001.
 * Хранится в localStorage — в следующем спринте можно завести таблицу.
 */
export const nextContractNo = (dateISO?: string): string => {
  const d = dateISO ? new Date(dateISO) : new Date();
  if (isNaN(d.getTime())) return "АЛ-XXXXXXXX-001";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const key = `alista_contract_seq_${yyyy}${mm}${dd}`;
  let n = 1;
  try {
    const prev = parseInt(localStorage.getItem(key) || "0", 10);
    n = (isNaN(prev) ? 0 : prev) + 1;
    localStorage.setItem(key, String(n));
  } catch {
    /* ignore */
  }
  return `АЛ-${yyyy}${mm}${dd}-${String(n).padStart(3, "0")}`;
};