export async function api(path, { method = 'GET', body, token, form } = {}) {
  let response;
  try {
    response = await fetch('/api' + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch (error) {
    throw new Error('Não foi possível conectar à API. Confira se o servidor está rodando na porta 3001.');
  }

  const texto = await response.text();
  let data = {};
  try { data = texto ? JSON.parse(texto) : {}; } catch { /* resposta não JSON */ }
  if (!response.ok) {
    if (data.erro) throw new Error(data.erro);
    if (texto.trim().startsWith('<')) {
      throw new Error(`A API respondeu com HTTP ${response.status} em /api${path}. Confira o proxy do Vite e o backend.`);
    }
    throw new Error(`Erro HTTP ${response.status} ao acessar /api${path}.`);
  }
  return data;
}
export const reais = (v) => (v == null ? null : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v));
const NOMES = { ILUMINACAO: 'Iluminação', ACESSORIOS: 'Acessórios', HIDRAULICA: 'Hidráulica', ABRACADEIRAS: 'Abraçadeiras',
  'EXTENÇOES': 'Extensões', 'DISP PROTEÇAO': 'Dispositivos de Proteção', LAMPADAS: 'Lâmpadas', 'TELECOMUNICAÇAO': 'Telecomunicação',
  'CLIMATIZAÇAO': 'Climatização', LUMINARIAS: 'Luminárias', ELETRODUTO: 'Eletroduto', 'ELETRODUTO FLEX': 'Eletroduto Flexível',
  'ELETRODUTO RIG': 'Eletroduto Rígido', 'ARRUELA ZINC': 'Arruela Zincada', 'FIXAÇÃO': 'Fixação', 'MODULOS': 'Módulos',
  'FUSIVEL': 'Fusível', 'LAMINA': 'Lâmina', 'NUMEROS': 'Números', 'QDC': 'QDC (Quadros de Distribuição)', 'EPI': 'EPI' };
export const nomeGrupo = (g) => NOMES[g] || g.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
