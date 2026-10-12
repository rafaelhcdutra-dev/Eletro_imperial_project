import 'dotenv/config';
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'eletro_imperial',
  charset: 'utf8mb4',
  decimalNumbers: true,
  connectionLimit: 10,
});

// Cria as tabelas de login se ainda não existirem (não mexe em nada que já existe).
export async function garantirTabelas() {
  await pool.query(`CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    senha_hash VARCHAR(100) NOT NULL,
    papel ENUM('admin','funcionario') NOT NULL DEFAULT 'funcionario',
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL, email VARCHAR(160) UNIQUE, whatsapp VARCHAR(30),
    documento VARCHAR(20), senha_hash VARCHAR(100), criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}
