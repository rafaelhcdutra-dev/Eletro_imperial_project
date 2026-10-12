CREATE DATABASE IF NOT EXISTS eletro_imperial CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eletro_imperial;

CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  descricao VARCHAR(255) NOT NULL,
  grupo VARCHAR(80) NOT NULL DEFAULT 'OUTROS',
  subgrupo VARCHAR(80) NULL,
  unidade VARCHAR(10) NULL,
  ncm VARCHAR(12) NULL,
  referencia VARCHAR(60) NULL,
  preco DECIMAL(10,2) NULL,            -- NULL = "Consulte o preço"
  estoque DECIMAL(12,2) NULL,          -- uso interno, não aparece no site
  marca VARCHAR(80) NULL,              -- preencha pelo painel admin
  especificacao TEXT NULL,             -- preencha pelo painel admin
  imagem_url VARCHAR(500) NULL,        -- preencha pelo painel admin
  destaque TINYINT(1) NOT NULL DEFAULT 0,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grupo (grupo),
  INDEX idx_descricao (descricao),
  INDEX idx_destaque (destaque)
);

CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(50) PRIMARY KEY,
  valor VARCHAR(500) NOT NULL
);
INSERT IGNORE INTO configuracoes (chave, valor) VALUES
  ('whatsapp', '551140292918'),
  ('telefone', '(11) 4029-2918'),
  ('horario_semana', '08:00 às 18:00'),
  ('horario_sabado', '08:00 às 16:00'),
  ('instagram', '');

CREATE TABLE IF NOT EXISTS orcamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  empresa VARCHAR(120) NULL,
  lista TEXT NOT NULL,
  observacoes TEXT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Funcionários que acessam o painel (/admin). O primeiro admin é criado pela API (ADMIN_EMAIL/ADMIN_SENHA no .env).
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL,
  papel ENUM('admin','funcionario') NOT NULL DEFAULT 'funcionario',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clientes (conta opcional no site: nome, e-mail, WhatsApp e senha)
-- (a tabela clientes abaixo já é usada pelo cadastro de clientes do site)
-- Estrutura reservada para o futuro e-commerce (carrinho/pedidos)
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL, email VARCHAR(160) UNIQUE, whatsapp VARCHAR(30),
  documento VARCHAR(20), senha_hash VARCHAR(100), criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'novo', entrega VARCHAR(20) DEFAULT 'retirada',
  frete DECIMAL(10,2) DEFAULT 0, total DECIMAL(12,2) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
CREATE TABLE IF NOT EXISTS pedido_itens (
  id INT AUTO_INCREMENT PRIMARY KEY, pedido_id INT NOT NULL, produto_id INT NOT NULL,
  quantidade DECIMAL(10,2) NOT NULL, preco_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id), FOREIGN KEY (produto_id) REFERENCES produtos(id)
);
