import { useEffect, useState } from 'react';
import { api, reais } from '../api.js';
import { useTitulo } from '../App.jsx';

const CAMPOS = [['descricao', 'Descrição'], ['marca', 'Marca'], ['especificacao', 'Especificação'], ['preco', 'Preço (R$)'], ['unidade', 'Unidade']];

export default function Admin() {
  useTitulo('Painel administrativo | Eletro Imperial');
  const [token, setToken] = useState(localStorage.getItem('ei_token') || '');
  const [usuario, setUsuario] = useState(() => { try { return JSON.parse(localStorage.getItem('ei_user')) || null; } catch { return null; } });
  const [f, setF] = useState({ email: '', senha: '' });
  const [aba, setAba] = useState('produtos');
  const [erro, setErro] = useState('');
  const sair = () => { localStorage.removeItem('ei_token'); localStorage.removeItem('ei_user'); setToken(''); setUsuario(null); };
  const chama = (p, o = {}) => api(p, { ...o, token }).catch((e) => { if (e.message === 'Não autorizado') sair(); throw e; });

  async function entrar(e) {
    e.preventDefault();
    try {
      const r = await api('/admin/login', { method: 'POST', body: f });
      localStorage.setItem('ei_token', r.token); localStorage.setItem('ei_user', JSON.stringify(r.usuario));
      setToken(r.token); setUsuario(r.usuario); setErro('');
    } catch (x) { setErro(x.message); }
  }
  if (!token) return (
    <section className="sec"><form className="form estreito" onSubmit={entrar}>
      <h1>Painel administrativo</h1>
      <p>Acesso exclusivo para funcionários.</p>
      <label>E-mail<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" /></label>
      <label>Senha<input type="password" required value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="current-password" /></label>
      <button className="btn btn-azul">Entrar</button>{erro && <p className="erro">{erro}</p>}
    </form></section>
  );
  const ehAdmin = usuario?.tipo === 'admin';
  const abas = ['produtos', 'importar', 'configurações', 'orçamentos', ...(ehAdmin ? ['funcionários'] : [])];
  return (
    <section className="sec"><div className="wrap">
      <p className="contagem">Logado como <b>{usuario?.nome}</b>{ehAdmin ? ' (administrador)' : ''}</p>
      <div className="abas">{abas.map((a) => <button key={a} className={aba === a ? 'on' : ''} onClick={() => setAba(a)}>{a}</button>)}<button onClick={sair}>sair</button></div>
      {aba === 'produtos' && <Produtos chama={chama} />}
      {aba === 'importar' && <Importar chama={chama} token={token} />}
      {aba === 'configurações' && <Config chama={chama} />}
      {aba === 'orçamentos' && <Orcamentos chama={chama} />}
      {aba === 'funcionários' && ehAdmin && <Funcionarios chama={chama} />}
    </div></section>
  );
}

function FotoProduto({ chama, valor, onChange }) {
  const [env, setEnv] = useState(false); const [erro, setErro] = useState('');
  async function enviar(e) {
    const arq = e.target.files[0]; if (!arq) return;
    setEnv(true); setErro('');
    const form = new FormData(); form.append('imagem', arq);
    try { const r = await chama('/admin/upload', { method: 'POST', form }); onChange(r.url); }
    catch (x) { setErro(x.message); }
    setEnv(false); e.target.value = '';
  }
  return (
    <div className="form-campo">
      <span>Foto do produto</span>
      <div className="up">
        {valor ? <img src={valor} alt="Prévia" /> : <div className="up-vazio">sem foto</div>}
        <div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={enviar} disabled={env} />
          {env && <small> Enviando...</small>}
          {valor && <button type="button" className="btn btn-borda-esc sm" onClick={() => onChange('')}>Remover foto</button>}
        </div>
      </div>
      <small>JPG, PNG, WEBP ou GIF, até 5 MB. Ou cole um link:</small>
      <input value={valor ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
      {erro && <p className="erro">{erro}</p>}
    </div>
  );
}

function Produtos({ chama }) {
  const [q, setQ] = useState(''); const [pagina, setPagina] = useState(1);
  const [d, setD] = useState({ itens: [], paginas: 1, total: 0 }); const [ed, setEd] = useState(null); const [novo, setNovo] = useState(false);
  const [categorias, setCategorias] = useState([]); const [modalCategoria, setModalCategoria] = useState(false);
  const [nomeCategoria, setNomeCategoria] = useState(''); const [erroCategoria, setErroCategoria] = useState(''); const [salvandoCategoria, setSalvandoCategoria] = useState(false);
  const carregar = () => chama(`/admin/produtos?q=${encodeURIComponent(q)}&pagina=${pagina}&limite=20`).then(setD).catch(() => {});
  const carregarCategorias = () => chama('/admin/categorias').then(setCategorias).catch(() => {});
  useEffect(() => { const t = setTimeout(carregar, 300); return () => clearTimeout(t); }, [q, pagina]);
  useEffect(() => { carregarCategorias(); }, []);
  async function criarCategoria(e) {
    e.preventDefault(); setErroCategoria(''); setSalvandoCategoria(true);
    try {
      const r = await chama('/admin/categorias', { method: 'POST', body: { nome: nomeCategoria } });
      const atualizadas = await chama('/admin/categorias');
      setCategorias(atualizadas); setEd((atual) => atual ? { ...atual, grupo: r.nome } : atual);
      setNomeCategoria(''); setModalCategoria(false);
    } catch (x) { setErroCategoria(x.message); }
    finally { setSalvandoCategoria(false); }
  }
  async function salvar(e) {
    e.preventDefault();
    const { id, ...corpo } = ed;
    try { novo ? await chama('/admin/produtos', { method: 'POST', body: corpo }) : await chama('/admin/produtos/' + id, { method: 'PUT', body: corpo }); setEd(null); setNovo(false); carregar(); }
    catch (x) { alert(x.message); }
  }
  return (
    <>
      <div className="filtros"><input placeholder="Buscar por nome, código ou marca" value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); }} />
        <button className="btn btn-azul sm" onClick={() => { setNovo(true); setEd({ codigo: '', descricao: '', grupo: 'OUTROS', ativo: 1, destaque: 0 }); }}>+ Novo produto</button></div>
      <p className="contagem">{d.total} produtos</p>
      <div className="tabela-scroll"><table className="tab"><thead><tr><th>Código</th><th>Descrição</th><th>Marca</th><th>Preço</th><th>Dest.</th><th>Ativo</th><th /></tr></thead>
        <tbody>{d.itens.map((p) => <tr key={p.id}><td>{p.codigo}</td><td>{p.descricao}</td><td>{p.marca}</td><td>{reais(p.preco) || '—'}</td><td>{p.destaque ? '★' : ''}</td><td>{p.ativo ? 'sim' : 'não'}</td>
          <td><button className="btn btn-borda-esc sm" onClick={() => { setNovo(false); setEd(p); }}>Editar</button></td></tr>)}</tbody></table></div>
      <div className="paginacao"><button className="btn btn-borda-esc sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>←</button><span>{pagina}/{d.paginas}</span><button className="btn btn-borda-esc sm" disabled={pagina >= d.paginas} onClick={() => setPagina(pagina + 1)}>→</button></div>
      {ed && <div className="modal"><form className="form" onSubmit={salvar}>
        <h2>{novo ? 'Novo produto' : 'Editar produto'}</h2>
        {novo && <label>Código (deixe vazio para gerar automático)<input value={ed.codigo} onChange={(e) => setEd({ ...ed, codigo: e.target.value })} /></label>}
        {CAMPOS.map(([k, r]) => <label key={k}>{r}<input value={ed[k] ?? ''} onChange={(e) => setEd({ ...ed, [k]: e.target.value })} /></label>)}
        <div className="categoria-campo">
          <label htmlFor="produto-grupo">Categoria</label>
          <div className="categoria-selecao">
            <select id="produto-grupo" required value={ed.grupo || ''} onChange={(e) => setEd({ ...ed, grupo: e.target.value })}>
              <option value="" disabled>Selecione uma categoria</option>
              {categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
              {ed.grupo && !categorias.includes(ed.grupo) && <option value={ed.grupo}>{ed.grupo}</option>}
            </select>
            <button type="button" className="btn btn-borda-esc sm" onClick={() => { setErroCategoria(''); setModalCategoria(true); }}>+ Nova categoria</button>
          </div>
        </div>
        <FotoProduto chama={chama} valor={ed.imagem_url} onChange={(url) => setEd({ ...ed, imagem_url: url })} />
        <label className="check"><input type="checkbox" checked={!!ed.destaque} onChange={(e) => setEd({ ...ed, destaque: e.target.checked ? 1 : 0 })} /> Produto em destaque na página inicial</label>
        <label className="check"><input type="checkbox" checked={!!ed.ativo} onChange={(e) => setEd({ ...ed, ativo: e.target.checked ? 1 : 0 })} /> Visível no site</label>
        <div className="botoes"><button className="btn btn-azul">Salvar</button><button type="button" className="btn btn-borda-esc" onClick={() => setEd(null)}>Cancelar</button></div>
      </form></div>}
      {modalCategoria && <div className="modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalCategoria(false); }}>
        <form className="form modal-categoria" onSubmit={criarCategoria}>
          <h2>Nova categoria</h2>
          <p>Cadastre uma categoria para reutilizá-la nos produtos da loja.</p>
          <label>Nome da categoria<input autoFocus required minLength={2} maxLength={80} value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} placeholder="Ex.: Iluminação" /></label>
          {erroCategoria && <p className="erro">{erroCategoria}</p>}
          <div className="botoes"><button className="btn btn-azul" disabled={salvandoCategoria}>{salvandoCategoria ? 'Salvando...' : 'Salvar categoria'}</button><button type="button" className="btn btn-borda-esc" onClick={() => setModalCategoria(false)}>Cancelar</button></div>
        </form>
      </div>}
    </>
  );
}

function Importar({ chama }) {
  const [msg, setMsg] = useState(''); const [env, setEnv] = useState(false);
  async function enviar(e) {
    e.preventDefault(); setEnv(true); setMsg('');
    const form = new FormData(); form.append('arquivo', e.target.arquivo.files[0]);
    try { const r = await chama('/admin/importar', { method: 'POST', form }); setMsg(`${r.importados} produtos importados/atualizados.`); } catch (x) { setMsg('Erro: ' + x.message); }
    setEnv(false);
  }
  return (
    <form className="form estreito" onSubmit={enviar}>
      <h2>Atualizar produtos pela planilha</h2>
      <p>Envie o arquivo "Todos_Produtos" exportado pelo seu sistema. Produtos existentes (mesmo código) têm descrição, preço e estoque atualizados; produtos novos são adicionados. Marca, especificação, foto, destaque e visibilidade que você editou aqui são preservados.</p>
      <input type="file" name="arquivo" accept=".xls,.html,.htm" required />
      <button className="btn btn-azul" disabled={env}>{env ? 'Importando...' : 'Importar'}</button>{msg && <p className="ok">{msg}</p>}
    </form>
  );
}

function Config({ chama }) {
  const [c, setC] = useState(null); const [ok, setOk] = useState(false);
  useEffect(() => { api('/config').then(setC); }, []);
  if (!c) return null;
  const R = { whatsapp: 'WhatsApp (só números com 55 + DDD)', telefone: 'Telefone exibido', horario_semana: 'Horário seg. a sex.', horario_sabado: 'Horário sábado', instagram: 'Link do Instagram' };
  return (
    <form className="form estreito" onSubmit={async (e) => { e.preventDefault(); await chama('/admin/config', { method: 'PUT', body: c }); setOk(true); }}>
      {Object.entries(R).map(([k, r]) => <label key={k}>{r}<input value={c[k] ?? ''} onChange={(e) => setC({ ...c, [k]: e.target.value })} /></label>)}
      <button className="btn btn-azul">Salvar</button>{ok && <p className="ok">Salvo! Recarregue o site para ver.</p>}
    </form>
  );
}

function Orcamentos({ chama }) {
  const [l, setL] = useState([]);
  useEffect(() => { chama('/admin/orcamentos').then(setL).catch(() => {}); }, []);
  return <div>{l.map((o) => <article className="artigo" key={o.id}><small>{new Date(o.criado_em).toLocaleString('pt-BR')}</small><h3>{o.nome} — {o.whatsapp}{o.empresa ? ` — ${o.empresa}` : ''}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{o.lista}{o.observacoes ? `\n\nObs.: ${o.observacoes}` : ''}</p></article>)}{!l.length && <p>Nenhum pedido ainda.</p>}</div>;
}

function Funcionarios({ chama }) {
  const [l, setL] = useState([]); const [f, setF] = useState({ nome: '', email: '', senha: '', papel: 'funcionario' }); const [msg, setMsg] = useState('');
  const carregar = () => chama('/admin/usuarios').then(setL).catch(() => {});
  useEffect(() => { carregar(); }, []);
  async function criar(e) {
    e.preventDefault(); setMsg('');
    try { await chama('/admin/usuarios', { method: 'POST', body: f }); setF({ nome: '', email: '', senha: '', papel: 'funcionario' }); setMsg('Funcionário cadastrado.'); carregar(); }
    catch (x) { setMsg('Erro: ' + x.message); }
  }
  async function alterar(id, body) { try { await chama('/admin/usuarios/' + id, { method: 'PUT', body }); carregar(); } catch (x) { alert(x.message); } }
  return (
    <>
      <form className="form estreito" onSubmit={criar}>
        <h2>Novo funcionário</h2>
        <label>Nome<input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
        <label>E-mail (será o login)<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label>Senha inicial (mínimo 6 caracteres)<input type="text" required minLength={6} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} /></label>
        <label>Permissão<select value={f.papel} onChange={(e) => setF({ ...f, papel: e.target.value })}><option value="funcionario">Funcionário (produtos, importar, orçamentos)</option><option value="admin">Administrador (também gerencia funcionários)</option></select></label>
        <button className="btn btn-azul">Cadastrar</button>{msg && <p className={msg.startsWith('Erro') ? 'erro' : 'ok'}>{msg}</p>}
      </form>
      <div className="tabela-scroll"><table className="tab"><thead><tr><th>Nome</th><th>E-mail</th><th>Permissão</th><th>Ativo</th><th /></tr></thead>
        <tbody>{l.map((u) => <tr key={u.id}><td>{u.nome}</td><td>{u.email}</td><td>{u.papel === 'admin' ? 'administrador' : 'funcionário'}</td><td>{u.ativo ? 'sim' : 'não'}</td>
          <td className="botoes-linha">
            <button className="btn btn-borda-esc sm" onClick={() => alterar(u.id, { ativo: u.ativo ? 0 : 1 })}>{u.ativo ? 'Desativar' : 'Reativar'}</button>{' '}
            <button className="btn btn-borda-esc sm" onClick={() => { const s = prompt('Nova senha para ' + u.nome + ' (mínimo 6 caracteres):'); if (s) alterar(u.id, { senha: s }); }}>Trocar senha</button>
          </td></tr>)}</tbody></table></div>
    </>
  );
}
