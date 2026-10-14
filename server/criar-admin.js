
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, garantirTabelas } from './db.js';

async function criarAdmin() {
  try {
    const nome = String(process.env.ADMIN_NOME || '').trim();
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const senha = String(process.env.ADMIN_SENHA || '');

    if (!nome || !email || senha.length < 8) {
      throw new Error(
        'Configure ADMIN_NOME, ADMIN_EMAIL e ADMIN_SENHA (mínimo de 8 caracteres) no .env.'
      );
    }

    await garantirTabelas();

    const [usuarios] = await pool.query(
      'SELECT id, papel FROM usuarios WHERE email = ?',
      [email]
    );

    if (usuarios.length > 0) {
      throw new Error(
        'Esse e-mail já existe. Nenhum usuário foi alterado.'
      );
    }

    const [admins] = await pool.query(
      "SELECT id FROM usuarios WHERE papel = 'admin' LIMIT 1"
    );

    if (admins.length > 0) {
      throw new Error(
        'Já existe um administrador. Use o painel para gerenciar usuários.'
      );
    }

    const hash = await bcrypt.hash(senha, 12);

    await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, papel, ativo)
       VALUES (?, ?, ?, 'admin', 1)`,
      [nome, email, hash]
    );

    console.log('Primeiro administrador criado com sucesso.');
  } finally {
    await pool.end();
  }
}

criarAdmin().catch((erro) => {
  console.error('Não foi possível criar o administrador:', erro.message);
  process.exitCode = 1;
});
