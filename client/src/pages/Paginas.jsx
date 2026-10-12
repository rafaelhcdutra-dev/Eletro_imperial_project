import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { api } from '../api.js';
import { wa, MSG } from '../whatsapp.js';
import { CATEGORIAS } from '../categorias.js';
import { POSTS, CATEGORIAS_BLOG } from '../blog.js';
import { useCfg, useTitulo, MAPS } from '../App.jsx';
import { useConta } from '../conta.jsx';

export function CategoriasGrid() {
  const cfg = useCfg();
  return (
    <div className="grade-cat">
      {CATEGORIAS.map(({ nome, icone: Icone, grupos, whatsapp }) => (
        <div className="cat" key={nome}>
          <Icone size={38} /><h3>{nome}</h3>
          {whatsapp
            ? <a className="btn btn-borda-esc sm" href={wa(cfg.whatsapp, `Olá, gostaria de informações sobre carregadores para veículos elétricos.`)} target="_blank" rel="noreferrer">CONSULTAR</a>
            : <Link className="btn btn-azul sm" to={`/produtos?grupos=${encodeURIComponent(grupos.join('|'))}&cat=${encodeURIComponent(nome)}`}>VER PRODUTOS</Link>}
        </div>
      ))}
    </div>
  );
}

export function Categorias() {
  useTitulo('Categorias de materiais elétricos | Eletro Imperial', 'Fios e cabos, disjuntores, tomadas e interruptores, iluminação e mais na Eletro Imperial, Salto SP.');
  return <section className="sec"><div className="wrap"><h1 className="tit">Encontre o que você precisa</h1><CategoriasGrid /></div></section>;
}

export function FormOrcamento() {
  const cfg = useCfg();
  const { cliente } = useConta();
  const [f, setF] = useState({ nome: '', whatsapp: '', empresa: '', lista: '', observacoes: '' });
  const [msg, setMsg] = useState('');
  // Se o cliente estiver logado, já preenche nome e WhatsApp
  useEffect(() => { if (cliente) setF((a) => ({ ...a, nome: a.nome || cliente.nome || '', whatsapp: a.whatsapp || cliente.whatsapp || '' })); }, [cliente]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function enviar(e) {
    e.preventDefault();
    try {
      await api('/orcamentos', { method: 'POST', body: f });
    } catch { /* mesmo se o salvamento falhar, o pedido segue pelo WhatsApp */ }
    window.open(wa(cfg.whatsapp, MSG.lista(f)), '_blank');
    setMsg('Pedido registrado! Continue a conversa no WhatsApp para falar com nossa equipe.');
    setF({ nome: cliente?.nome || '', whatsapp: cliente?.whatsapp || '', empresa: '', lista: '', observacoes: '' });
  }
  return (
    <form className="form" onSubmit={enviar}>
      <label>Nome<input required value={f.nome} onChange={set('nome')} /></label>
      <label>WhatsApp<input required value={f.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" /></label>
      <label>Empresa (opcional)<input value={f.empresa} onChange={set('empresa')} /></label>
      <label>Lista de materiais<textarea required rows="5" value={f.lista} onChange={set('lista')} placeholder="Ex.: 10 disjuntores 20A, 100m cabo 2,5mm..." /></label>
      <label>Observações<textarea rows="2" value={f.observacoes} onChange={set('observacoes')} /></label>
      <button className="btn btn-azul grande">SOLICITAR ORÇAMENTO</button>
      {msg && <p className="ok">{msg}</p>}
    </form>
  );
}

export function Orcamento() {
  useTitulo('Orçamento de materiais elétricos | Eletro Imperial', 'Envie sua lista de materiais e receba o orçamento da Eletro Imperial, Salto SP.');
  const cfg = useCfg();
  return (
    <section className="sec"><div className="wrap">
      <h1 className="tit">Precisa de uma cotação?</h1>
      <p className="centro">Envie sua lista de materiais para a Eletro Imperial e nossa equipe prepara seu orçamento.</p>
      <p className="centro"><a className="btn btn-amarelo grande" href={wa(cfg.whatsapp, MSG.orcamento)} target="_blank" rel="noreferrer">ENVIAR LISTA PELO WHATSAPP</a></p>
      <div className="estreito"><FormOrcamento /></div>
    </div></section>
  );
}

export function Sobre() {
  useTitulo('Sobre a Eletro Imperial | Materiais Elétricos em Salto SP');
  const itens = ['Atendimento', 'Qualidade', 'Variedade', 'Conhecimento técnico', 'Segurança', 'Proximidade com o cliente'];
  return (
    <section className="sec"><div className="wrap estreito">
      <h1 className="tit">Sobre a Eletro Imperial</h1>
      <p className="lead">A Eletro Imperial é uma loja especializada em materiais elétricos localizada em Salto-SP, oferecendo produtos e soluções para instalações elétricas residenciais, comerciais e industriais.</p>
      <div className="grade-cat">{itens.map((i) => <div className="cat" key={i}><h3>{i}</h3></div>)}</div>
    </div></section>
  );
}

export function Blog() {
  useTitulo('Mundo da Elétrica | Dicas e segurança elétrica | Eletro Imperial', 'Conteúdo técnico e fácil de entender sobre disjuntores, DR, DPS, cabos e veículos elétricos.');
  return (
    <section className="sec"><div className="wrap estreito">
      <h1 className="tit">Mundo da Elétrica</h1>
      <div className="chips">{CATEGORIAS_BLOG.map((c) => <span key={c}>{c}</span>)}</div>
      {POSTS.map((p) => <article className="artigo" key={p.titulo}><small>{p.cat}</small><h2>{p.titulo}</h2><p>{p.texto}</p></article>)}
      <p className="aviso">Conteúdo informativo. Projetos e instalações elétricas devem ser feitos por profissionais habilitados, conforme as normas técnicas.</p>
    </div></section>
  );
}

export function Horarios() {
  const cfg = useCfg();
  return <p className="horarios"><Clock size={16} /> <b>Segunda a sexta:</b> {cfg.horario_semana}<br /><b>Sábado:</b> {cfg.horario_sabado}</p>;
}

export function Contato() {
  useTitulo('Contato e localização | Eletro Imperial – Salto SP');
  const cfg = useCfg();
  return (
    <section className="sec"><div className="wrap duas">
      <div>
        <h1 className="tit esq">Venha até a Eletro Imperial</h1>
        <address><MapPin size={16} /> <b>Avenida Walter Nardelli, 682<br />Parque Imperial<br />Salto – SP<br />CEP 13323-760</b></address>
        <p>Telefone/WhatsApp: <b>{cfg.telefone}</b></p>
        <Horarios />
        <p><a className="btn btn-azul" href={MAPS} target="_blank" rel="noreferrer">COMO CHEGAR</a></p>
      </div>
      <iframe title="Mapa" className="mapa" loading="lazy" src="https://www.google.com/maps?q=Avenida+Walter+Nardelli+682+Salto+SP&output=embed" />
    </div></section>
  );
}
