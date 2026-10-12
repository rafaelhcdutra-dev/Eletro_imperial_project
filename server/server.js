import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, garantirTabelas } from './db.js';
import app from './app.js';

async function iniciar() {
  try {
    await garantirTabelas();
    // Testa a conexão antes de abrir a porta para evitar API aparentemente online sem banco.
    await pool.query('SELECT 1');
    const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM usuarios');
    if (!n && process.env.ADMIN_EMAIL && process.env.ADMIN_SENHA) {
      await pool.query(
        'INSERT INTO usuarios (nome,email,senha_hash,papel) VALUES (?,?,?,?)',
        ['Administrador', process.env.ADMIN_EMAIL.trim().toLowerCase(), await bcrypt.hash(process.env.ADMIN_SENHA, 10), 'admin']
      );
      console.log('Administrador inicial criado.');
    } else if (!n) {
      console.warn('Nenhum funcionário cadastrado. Use npm run criar-funcionario ou configure ADMIN_EMAIL e ADMIN_SENHA no .env.');
    }
    const porta = Number(process.env.PORT || 3001);
    const server = app.listen(porta, () => console.log(`API Eletro Imperial rodando na porta ${porta}`));
    const encerrar = (sinal) => server.close(async () => { await pool.end(); process.exit(0); });
    process.on('SIGINT', encerrar);
    process.on('SIGTERM', encerrar);
  } catch (error) {
    console.error('Não foi possível iniciar a API. Confira o MySQL e as variáveis do .env.');
    console.error('Detalhe:', error.code || error.message);
    process.exit(1);
  }
}

iniciar();
