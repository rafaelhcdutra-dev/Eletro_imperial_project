import { useEffect, useState } from 'react';
import { useConta } from '../conta.jsx';
import { useTitulo } from '../App.jsx';

export default function Conta() {
  useTitulo('Minha conta | Eletro Imperial');
  const { cliente } = useConta();
  return <section className="sec"><div className="wrap">{cliente ? <Perfil /> : <EntrarOuCadastrar />}</div></section>;
}

function EntrarOuCadastrar() {
  const { entrar, cadastrar } = useConta();
  const [modo, setModo] = useState('entrar');
  const [f, setF] = useState({ nome: '', email: '', whatsapp: '', senha: '' });
  const [erro, setErro] = useState(''); const [env, setEnv] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function enviar(e) {
    e.preventDefault(); setEnv(true); setErro('');
    try { await (modo === 'entrar' ? entrar({ email: f.email, senha: f.senha }) : cadastrar(f)); }
    catch (x) { setErro(x.message); }
    setEnv(false);
  }
  return (
    <form className="form estreito" onSubmit={enviar}>
      <h1>Minha conta</h1>
      <p>Não precisa de conta para pedir orçamento. Se quiser, crie uma para guardar seu nome e WhatsApp e agilizar os próximos pedidos.</p>
      <div className="alt">
        <button type="button" className={modo === 'entrar' ? 'on' : ''} onClick={() => setModo('entrar')}>Entrar</button>
        <button type="button" className={modo === 'cadastro' ? 'on' : ''} onClick={() => setModo('cadastro')}>Criar conta</button>
      </div>
      {modo === 'cadastro' && <label>Nome<input required value={f.nome} onChange={set('nome')} autoComplete="name" /></label>}
      <label>E-mail<input type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
      {modo === 'cadastro' && <label>WhatsApp<input value={f.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" autoComplete="tel" /></label>}
      <label>Senha{modo === 'cadastro' ? ' (mínimo 6 caracteres)' : ''}<input type="password" required minLength={modo === 'cadastro' ? 6 : undefined} value={f.senha} onChange={set('senha')} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} /></label>
      <button className="btn btn-azul" disabled={env}>{modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
      {erro && <p className="erro">{erro}</p>}
    </form>
  );
}

function Perfil() {
  const { cliente, atualizar, sair } = useConta();
  const [f, setF] = useState({ nome: cliente.nome || '', whatsapp: cliente.whatsapp || '', senha: '' });
  const [msg, setMsg] = useState(''); const [erro, setErro] = useState('');
  useEffect(() => setF((a) => ({ ...a, nome: cliente.nome || '', whatsapp: cliente.whatsapp || '' })), [cliente]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function salvar(e) {
    e.preventDefault(); setMsg(''); setErro('');
    try { await atualizar({ nome: f.nome, whatsapp: f.whatsapp, ...(f.senha ? { senha: f.senha } : {}) }); setF((a) => ({ ...a, senha: '' })); setMsg('Dados salvos!'); }
    catch (x) { setErro(x.message); }
  }
  return (
    <form className="form estreito" onSubmit={salvar}>
      <h1>Olá, {cliente.nome.split(' ')[0]}!</h1>
      <p>Seus dados são usados para preencher automaticamente o formulário de orçamento.</p>
      <label>E-mail<input value={cliente.email} disabled /></label>
      <label>Nome<input required value={f.nome} onChange={set('nome')} /></label>
      <label>WhatsApp<input value={f.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" /></label>
      <label>Nova senha (deixe vazio para manter)<input type="password" minLength={6} value={f.senha} onChange={set('senha')} autoComplete="new-password" /></label>
      <div className="botoes"><button className="btn btn-azul">Salvar</button><button type="button" className="btn btn-borda-esc" onClick={sair}>Sair</button></div>
      {msg && <p className="ok">{msg}</p>}{erro && <p className="erro">{erro}</p>}
    </form>
  );
}
