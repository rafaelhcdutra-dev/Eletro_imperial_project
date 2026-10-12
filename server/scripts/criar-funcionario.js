// Uso: npm run criar-funcionario -- "Maria Silva" maria@loja.com senha123 [admin|funcionario]
// Se o e-mail já existir, atualiza a senha (serve também para "esqueci a senha").
import bcrypt from 'bcryptjs';
import { pool, garantirTabelas } from '../db.js';

const [nome, email, senha, papel = 'funcionario'] = process.argv.slice(2);
if (!nome || !email || !senha || senha.length < 6 || !['admin', 'funcionario'].includes(papel)) {
  console.log('Uso: npm run criar-funcionario -- "Nome" email@exemplo.com senha(min. 6) [admin|funcionario]');
  process.exit(1);
}
await garantirTabelas();
await pool.query(
  `INSERT INTO usuarios (nome,email,senha_hash,papel) VALUES (?,?,?,?)
   ON DUPLICATE KEY UPDATE nome=VALUES(nome), senha_hash=VALUES(senha_hash), papel=VALUES(papel), ativo=1`,
  [nome, email.trim().toLowerCase(), await bcrypt.hash(senha, 10), papel]);
console.log(`Pronto: ${papel} "${nome}" (${email}) cadastrado.`);
await pool.end();
