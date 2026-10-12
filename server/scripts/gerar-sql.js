// Gera database/produtos.sql (para rodar direto no MySQL Workbench), sem precisar de conexão com o banco.
import fs from 'fs';
import { lerPlanilha } from '../planilha.js';

const arquivo = process.argv[2];
const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? v : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`);
const produtos = lerPlanilha(fs.readFileSync(arquivo));
let sql = 'USE eletro_imperial;\nSET NAMES utf8mb4;\n';
for (let i = 0; i < produtos.length; i += 300) {
  sql += 'INSERT INTO produtos (codigo,descricao,grupo,subgrupo,unidade,ncm,referencia,preco,estoque) VALUES\n' +
    produtos.slice(i, i + 300).map((p) => `(${[p.codigo, p.descricao, p.grupo, p.subgrupo, p.unidade, p.ncm, p.referencia, p.preco, p.estoque].map(q).join(',')})`).join(',\n') +
    '\nON DUPLICATE KEY UPDATE descricao=VALUES(descricao), grupo=VALUES(grupo), subgrupo=VALUES(subgrupo), unidade=VALUES(unidade), ncm=VALUES(ncm), referencia=VALUES(referencia), preco=VALUES(preco), estoque=VALUES(estoque);\n';
}
fs.writeFileSync(new URL('../../database/produtos.sql', import.meta.url), sql);
console.log(produtos.length + ' produtos -> database/produtos.sql');
