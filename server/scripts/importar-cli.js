import fs from 'fs';
import { pool } from '../db.js';
import { lerPlanilha, gravarProdutos } from '../planilha.js';

const arquivo = process.argv[2];
if (!arquivo) { console.log('Uso: npm run importar -- "caminho/Todos_Produtos.xls"'); process.exit(1); }
const n = await gravarProdutos(pool, lerPlanilha(fs.readFileSync(arquivo)));
console.log(`${n} produtos importados/atualizados.`);
await pool.end();
