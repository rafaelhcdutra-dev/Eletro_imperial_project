export async function api(path, { method = 'GET', body, token, form } = {}) {
  const r = await fetch('/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.erro || 'Erro na requisição');
  return d;
}
export const reais = (v) => (v == null ? null : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v));
const NOMES = { ILUMINACAO: 'Iluminação', ACESSORIOS: 'Acessórios', HIDRAULICA: 'Hidráulica', ABRACADEIRAS: 'Abraçadeiras',
  'EXTENÇOES': 'Extensões', 'DISP PROTEÇAO': 'Dispositivos de Proteção', LAMPADAS: 'Lâmpadas', 'TELECOMUNICAÇAO': 'Telecomunicação',
  'CLIMATIZAÇAO': 'Climatização', LUMINARIAS: 'Luminárias', ELETRODUTO: 'Eletroduto', 'ELETRODUTO FLEX': 'Eletroduto Flexível',
  'ELETRODUTO RIG': 'Eletroduto Rígido', 'ARRUELA ZINC': 'Arruela Zincada', 'FIXAÇÃO': 'Fixação', 'MODULOS': 'Módulos',
  'FUSIVEL': 'Fusível', 'LAMINA': 'Lâmina', 'NUMEROS': 'Números', 'QDC': 'QDC (Quadros de Distribuição)', 'EPI': 'EPI' };
export const nomeGrupo = (g) => NOMES[g] || g.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
