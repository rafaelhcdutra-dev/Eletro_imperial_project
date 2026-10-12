import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { pool, garantirTabelas } from './db.js';
import { lerPlanilha, gravarProdutos } from './planilha.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const SEGREDO = process.env.JWT_SEGREDO;
if (!SEGREDO || SEGREDO.startsWith('troque-')) {
  console.error('Defina JWT_SEGREDO no arquivo .env (um texto longo e aleatório) antes de iniciar.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS, { maxAge: '30d', setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff') }));

// ---------- Utilitários ----------
const falha = (status, erro) => Object.assign(new Error(erro), { status });
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch((e) => {
  if (e.status) return res.status(e.status).json({ erro: e.message });
  if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Já existe um registro com esse código ou e-mail.' });
  console.error(e);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// Limite simples de tentativas de login por IP (10 a cada 15 min)
const tentativas = new Map();
setInterval(() => tentativas.clear(), 60 * 60 * 1000).unref();
const limita = (req, res, next) => {
  const agora = Date.now();
  const lista = (tentativas.get(req.ip) || []).filter((t) => agora - t < 15 * 60 * 1000);
  if (lista.length >= 10) return res.status(429).json({ erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
  lista.push(agora); tentativas.set(req.ip, lista); next();
};

const assina = (payload, expiresIn) => jwt.sign(payload, SEGREDO, { expiresIn });
const lerToken = (req) => {
  try { return jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SEGREDO); } catch { return null; }
};
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

// Funcionário (ou admin) logado. Confere no banco se a conta continua ativa.
const auth = wrap(async (req, res, next) => {
  const t = lerToken(req);
  if (!t || !['funcionario', 'admin'].includes(t.tipo)) throw falha(401, 'Não autorizado');
  const [[u]] = await pool.query('SELECT id,nome,papel,ativo FROM usuarios WHERE id=?', [t.id]);
  if (!u || !u.ativo) throw falha(401, 'Não autorizado');
  req.usuario = { id: u.id, nome: u.nome, tipo: u.papel };
  next();
});
const soAdmin = (req, res, next) => (req.usuario.tipo === 'admin' ? next() : res.status(403).json({ erro: 'Apenas administradores.' }));

// Cliente logado (opcional no site)
const authCliente = (req, res, next) => {
  const t = lerToken(req);
  if (!t || t.tipo !== 'cliente') return res.status(401).json({ erro: 'Não autorizado' });
  req.clienteId = t.id; next();
};

// ---------- Upload ----------
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
// Confere os primeiros bytes do arquivo para garantir que é mesmo uma imagem
const ehImagem = (arq) => {
  const b = Buffer.alloc(12); const fd = fs.openSync(arq, 'r'); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
  return (b[0] === 0xff && b[1] === 0xd8) || b.toString('latin1', 1, 4) === 'PNG' || b.toString('latin1', 0, 3) === 'GIF'
    || (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP');
};
const uploadImg = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (_, f, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXT[f.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, f, cb) => (EXT[f.mimetype] ? cb(null, true) : cb(falha(400, 'Envie uma imagem JPG, PNG, WEBP ou GIF.'))),
});
// Planilhas continuam em memória (não ficam salvas em disco)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ---------- Produtos (público) ----------
const PUBLICO = 'id,codigo,descricao,grupo,subgrupo,unidade,referencia,preco,marca,especificacao,imagem_url,destaque';

async function buscar(q, admin) {
  const w = [], p = [];
  if (!admin) w.push('ativo=1');
  if (q.grupos) { const g = String(q.grupos).split('|'); w.push(`grupo IN (${g.map(() => '?').join(',')})`); p.push(...g); }
  if (q.destaque) w.push('destaque=1');
  for (const palavra of String(q.q || '').split(/\s+/).filter(Boolean)) {
    w.push('(descricao LIKE ? OR codigo LIKE ? OR marca LIKE ? OR referencia LIKE ?)');
    const l = `%${palavra}%`; p.push(l, l, l, l);
  }
  const where = w.length ? 'WHERE ' + w.join(' AND ') : '';
  const limite = Math.min(+q.limite || 24, 100), pagina = Math.max(+q.pagina || 1, 1);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM produtos ${where}`, p);
  const [itens] = await pool.query(
    `SELECT ${admin ? '*' : PUBLICO} FROM produtos ${where} ORDER BY descricao LIMIT ? OFFSET ?`,
    [...p, limite, (pagina - 1) * limite]);
  return { itens, total, pagina, paginas: Math.ceil(total / limite) };
}

app.get('/api/produtos', wrap(async (req, res) => res.json(await buscar(req.query, false))));
app.get('/api/grupos', wrap(async (_, res) => {
  const [r] = await pool.query('SELECT grupo, COUNT(*) total FROM produtos WHERE ativo=1 GROUP BY grupo ORDER BY grupo');
  res.json(r);
}));
app.get('/api/config', wrap(async (_, res) => {
  const [r] = await pool.query('SELECT chave, valor FROM configuracoes');
  res.json(Object.fromEntries(r.map((x) => [x.chave, x.valor])));
}));
app.post('/api/orcamentos', wrap(async (req, res) => {
  const { nome, whatsapp, empresa, lista, observacoes } = req.body;
  if (!nome || !whatsapp || !lista) throw falha(400, 'Preencha nome, WhatsApp e lista.');
  await pool.query('INSERT INTO orcamentos (nome,whatsapp,empresa,lista,observacoes) VALUES (?,?,?,?,?)',
    [nome, whatsapp, empresa || null, lista, observacoes || null]);
  res.json({ ok: true });
}));

// ---------- Conta do cliente (opcional) ----------
const dadosCliente = (c) => ({ id: c.id, nome: c.nome, email: c.email, whatsapp: c.whatsapp });
const tokenCliente = (c) => assina({ tipo: 'cliente', id: c.id }, '30d');

app.post('/api/clientes/cadastro', limita, wrap(async (req, res) => {
  const nome = String(req.body.nome || '').trim().slice(0, 120);
  const email = String(req.body.email || '').trim().toLowerCase();
  const whatsapp = String(req.body.whatsapp || '').trim().slice(0, 30) || null;
  const senha = String(req.body.senha || '');
  if (!nome) throw falha(400, 'Informe seu nome.');
  if (!emailOk(email)) throw falha(400, 'E-mail inválido.');
  if (senha.length < 6) throw falha(400, 'A senha precisa ter pelo menos 6 caracteres.');
  const [[ja]] = await pool.query('SELECT id FROM clientes WHERE email=?', [email]);
  if (ja) throw falha(409, 'Este e-mail já está cadastrado. Faça login.');
  const [r] = await pool.query('INSERT INTO clientes (nome,email,whatsapp,senha_hash) VALUES (?,?,?,?)',
    [nome, email, whatsapp, await bcrypt.hash(senha, 10)]);
  const c = { id: r.insertId, nome, email, whatsapp };
  res.json({ token: tokenCliente(c), cliente: dadosCliente(c) });
}));
app.post('/api/clientes/login', limita, wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const [[c]] = await pool.query('SELECT * FROM clientes WHERE email=?', [email]);
  if (!c || !c.senha_hash || !(await bcrypt.compare(String(req.body.senha || ''), c.senha_hash)))
    throw falha(401, 'E-mail ou senha incorretos.');
  res.json({ token: tokenCliente(c), cliente: dadosCliente(c) });
}));
app.get('/api/clientes/me', authCliente, wrap(async (req, res) => {
  const [[c]] = await pool.query('SELECT * FROM clientes WHERE id=?', [req.clienteId]);
  if (!c) throw falha(401, 'Não autorizado');
  res.json(dadosCliente(c));
}));
app.put('/api/clientes/me', authCliente, wrap(async (req, res) => {
  const d = {};
  if (req.body.nome !== undefined) { d.nome = String(req.body.nome).trim().slice(0, 120); if (!d.nome) throw falha(400, 'Informe seu nome.'); }
  if (req.body.whatsapp !== undefined) d.whatsapp = String(req.body.whatsapp).trim().slice(0, 30) || null;
  if (req.body.senha) {
    if (String(req.body.senha).length < 6) throw falha(400, 'A senha precisa ter pelo menos 6 caracteres.');
    d.senha_hash = await bcrypt.hash(String(req.body.senha), 10);
  }
  if (Object.keys(d).length) await pool.query('UPDATE clientes SET ? WHERE id=?', [d, req.clienteId]);
  const [[c]] = await pool.query('SELECT * FROM clientes WHERE id=?', [req.clienteId]);
  res.json(dadosCliente(c));
}));

// ---------- Painel: login de funcionário ----------
app.post('/api/admin/login', limita, wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const [[u]] = await pool.query('SELECT * FROM usuarios WHERE email=? AND ativo=1', [email]);
  if (!u || !(await bcrypt.compare(String(req.body.senha || ''), u.senha_hash))) throw falha(401, 'E-mail ou senha incorretos.');
  res.json({ token: assina({ tipo: u.papel, id: u.id }, '12h'), usuario: { nome: u.nome, tipo: u.papel } });
}));
app.get('/api/admin/eu', auth, (req, res) => res.json({ nome: req.usuario.nome, tipo: req.usuario.tipo }));

// ---------- Painel: produtos ----------
const CAMPOS = ['codigo', 'descricao', 'grupo', 'subgrupo', 'unidade', 'referencia', 'preco', 'estoque', 'marca', 'especificacao', 'imagem_url', 'destaque', 'ativo'];
const limpa = (b) => {
  const d = Object.fromEntries(CAMPOS.filter((c) => c in b).map((c) => [c, b[c] === '' ? null : b[c]]));
  if (d.imagem_url && !/^(\/uploads\/|https?:\/\/)/.test(d.imagem_url)) throw falha(400, 'Foto inválida: use o envio de imagem ou um link http(s).');
  if (d.preco != null && Number.isNaN(Number(d.preco))) throw falha(400, 'Preço inválido.');
  return d;
};
app.get('/api/admin/produtos', auth, wrap(async (req, res) => res.json(await buscar(req.query, true))));
app.put('/api/admin/produtos/:id', auth, wrap(async (req, res) => {
  const d = limpa(req.body);
  if (!Object.keys(d).length) throw falha(400, 'Nada para atualizar');
  await pool.query('UPDATE produtos SET ? WHERE id=?', [d, req.params.id]);
  res.json({ ok: true });
}));
app.post('/api/admin/produtos', auth, wrap(async (req, res) => {
  const d = limpa(req.body);
  if (!d.descricao) throw falha(400, 'A descrição é obrigatória.');
  if (!d.codigo) d.codigo = 'WEB' + Date.now().toString(36).toUpperCase(); // código automático
  await pool.query('INSERT INTO produtos SET ?', [d]);
  res.json({ ok: true, codigo: d.codigo });
}));

// Envio de foto do produto -> salva em server/uploads e devolve a URL
app.post('/api/admin/upload', auth, (req, res, next) =>
  uploadImg.single('imagem')(req, res, (e) => {
    if (e instanceof multer.MulterError) return next(falha(400, e.code === 'LIMIT_FILE_SIZE' ? 'Imagem muito grande (máximo 5 MB).' : e.message));
    next(e);
  }),
wrap(async (req, res) => {
  if (!req.file) throw falha(400, 'Envie uma imagem.');
  if (!ehImagem(req.file.path)) { fs.unlinkSync(req.file.path); throw falha(400, 'O arquivo não é uma imagem válida.'); }
  res.json({ url: '/uploads/' + req.file.filename });
}));

app.post('/api/admin/importar', auth, upload.single('arquivo'), wrap(async (req, res) => {
  if (!req.file) throw falha(400, 'Envie o arquivo da planilha.');
  let produtos;
  try { produtos = lerPlanilha(req.file.buffer); } catch (e) { throw falha(400, e.message); }
  res.json({ importados: await gravarProdutos(pool, produtos) });
}));
app.put('/api/admin/config', auth, wrap(async (req, res) => {
  for (const [k, v] of Object.entries(req.body))
    await pool.query('INSERT INTO configuracoes (chave,valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=VALUES(valor)', [k, String(v)]);
  res.json({ ok: true });
}));
app.get('/api/admin/orcamentos', auth, wrap(async (_, res) => {
  const [r] = await pool.query('SELECT * FROM orcamentos ORDER BY id DESC LIMIT 100');
  res.json(r);
}));

// ---------- Painel: gerenciar funcionários (só administrador) ----------
app.get('/api/admin/usuarios', auth, soAdmin, wrap(async (_, res) => {
  const [r] = await pool.query('SELECT id,nome,email,papel,ativo,criado_em FROM usuarios ORDER BY nome');
  res.json(r);
}));
app.post('/api/admin/usuarios', auth, soAdmin, wrap(async (req, res) => {
  const nome = String(req.body.nome || '').trim().slice(0, 120);
  const email = String(req.body.email || '').trim().toLowerCase();
  const papel = req.body.papel === 'admin' ? 'admin' : 'funcionario';
  if (!nome || !emailOk(email)) throw falha(400, 'Informe nome e e-mail válidos.');
  if (String(req.body.senha || '').length < 6) throw falha(400, 'A senha precisa ter pelo menos 6 caracteres.');
  await pool.query('INSERT INTO usuarios (nome,email,senha_hash,papel) VALUES (?,?,?,?)',
    [nome, email, await bcrypt.hash(String(req.body.senha), 10), papel]);
  res.json({ ok: true });
}));
app.put('/api/admin/usuarios/:id', auth, soAdmin, wrap(async (req, res) => {
  const d = {};
  if (req.body.nome !== undefined) d.nome = String(req.body.nome).trim().slice(0, 120);
  if (req.body.papel !== undefined) d.papel = req.body.papel === 'admin' ? 'admin' : 'funcionario';
  if (req.body.ativo !== undefined) d.ativo = req.body.ativo ? 1 : 0;
  if (req.body.senha) {
    if (String(req.body.senha).length < 6) throw falha(400, 'A senha precisa ter pelo menos 6 caracteres.');
    d.senha_hash = await bcrypt.hash(String(req.body.senha), 10);
  }
  if (+req.params.id === req.usuario.id && (d.ativo === 0 || d.papel === 'funcionario'))
    throw falha(400, 'Você não pode desativar nem rebaixar a própria conta.');
  if (!Object.keys(d).length) throw falha(400, 'Nada para atualizar');
  await pool.query('UPDATE usuarios SET ? WHERE id=?', [d, req.params.id]);
  res.json({ ok: true });
}));

// ---------- Erros (ex.: upload recusado) ----------
app.use((e, req, res, next) => { // eslint-disable-line no-unused-vars
  if (e.status) return res.status(e.status).json({ erro: e.message });
  console.error(e);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

// ---------- Site (se já tiver rodado "npm run build" no client) ----------
const DIST = path.join(__dirname, '../client/dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^\/(?!api\/|uploads\/).*/, (_, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// ---------- Início ----------
await garantirTabelas();
const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM usuarios');
if (!n && process.env.ADMIN_EMAIL && process.env.ADMIN_SENHA) {
  await pool.query('INSERT INTO usuarios (nome,email,senha_hash,papel) VALUES (?,?,?,?)',
    ['Administrador', process.env.ADMIN_EMAIL.trim().toLowerCase(), await bcrypt.hash(process.env.ADMIN_SENHA, 10), 'admin']);
  console.log('Administrador inicial criado: ' + process.env.ADMIN_EMAIL);
} else if (!n) {
  console.warn('Nenhum funcionário cadastrado. Defina ADMIN_EMAIL e ADMIN_SENHA no .env ou use: npm run criar-funcionario');
}
const porta = process.env.PORT || 3001;
app.listen(porta, () => console.log('API Eletro Imperial rodando na porta ' + porta));
