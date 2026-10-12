// Lê a planilha exportada pelo sistema da loja (arquivo .xls que na verdade é uma tabela HTML)
// e grava/atualiza os produtos no MySQL (chave: código do produto).
const CORRIGE_GRUPO = { 'FERRRAMENTAS MANUAIS': 'FERRAMENTAS MANUAIS', 'GRUPO PADRAO': 'OUTROS' };

const decodifica = (s) => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const numero = (s) => {
  if (!s) return null;
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(n) ? null : n;
};

export function lerPlanilha(conteudo) {
  const html = Buffer.isBuffer(conteudo) ? conteudo.toString('utf8') : conteudo;
  const linhas = [...html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis)].map((m) =>
    [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/gis)].map((c) =>
      decodifica(c[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()));
  const produtos = [];
  for (const c of linhas.slice(1)) {
    if (!c[0] || !c[1]) continue;
    const grupo = (c[7] || 'OUTROS').toUpperCase();
    const preco = numero(c[5]);
    produtos.push({
      codigo: c[0], descricao: c[1].slice(0, 255),
      grupo: CORRIGE_GRUPO[grupo] || grupo,
      subgrupo: c[11] && c[11] !== 'SUB GRUPO PADRAO' ? c[11] : null,
      unidade: c[3] || null, ncm: c[4] || null, referencia: c[6] || null,
      preco: preco && preco > 0 ? preco : null, estoque: numero(c[2]),
    });
  }
  if (!produtos.length) throw new Error('Nenhum produto encontrado no arquivo.');
  return produtos;
}

export async function gravarProdutos(pool, produtos) {
  for (let i = 0; i < produtos.length; i += 500) {
    const lote = produtos.slice(i, i + 500).map((p) => [p.codigo, p.descricao, p.grupo, p.subgrupo,
      p.unidade, p.ncm, p.referencia, p.preco, p.estoque]);
    // Atualiza descrição/preço/estoque etc. Não mexe em marca, especificação, imagem, destaque e ativo.
    await pool.query(
      `INSERT INTO produtos (codigo,descricao,grupo,subgrupo,unidade,ncm,referencia,preco,estoque) VALUES ?
       ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), grupo=VALUES(grupo), subgrupo=VALUES(subgrupo),
       unidade=VALUES(unidade), ncm=VALUES(ncm), referencia=VALUES(referencia), preco=VALUES(preco), estoque=VALUES(estoque)`,
      [lote]);
  }
  return produtos.length;
}
