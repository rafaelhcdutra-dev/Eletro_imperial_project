import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, HardHat, MapPin, MessageCircle, Search } from 'lucide-react';
import { api } from '../api.js';
import { wa, MSG } from '../whatsapp.js';
import { useCfg, useTitulo, MAPS } from '../App.jsx';
import ProdutoCard from './Produto.jsx';
import { CategoriasGrid, FormOrcamento, Horarios } from './Paginas.jsx';
import { POSTS } from '../blog.js';

const Painel = () => (
  <svg viewBox="0 0 420 340" className="painel" role="img" aria-label="Quadro elétrico com disjuntores">
    <rect x="10" y="10" width="400" height="320" rx="14" fill="#1b2330" stroke="#2f3b4f" strokeWidth="4" />
    <rect x="30" y="30" width="360" height="26" rx="6" fill="#0a6cff" /><text x="46" y="48" fill="#fff" fontSize="14" fontWeight="700">QUADRO DE DISTRIBUIÇÃO</text>
    {[0, 1, 2].map((r) => <g key={r}>
      <rect x="30" y={80 + r * 82} width="360" height="8" fill="#2f3b4f" />
      {Array.from({ length: 9 }).map((_, i) => <g key={i}>
        <rect x={38 + i * 39} y={92 + r * 82} width="32" height="58" rx="4" fill={r === 0 && i === 0 ? '#2b3547' : '#eef2f7'} />
        <rect x={44 + i * 39} y={100 + r * 82} width="20" height="22" rx="3" fill={i % 4 === 0 ? '#ffb300' : '#1b2330'} />
        <rect x={50 + i * 39} y={(i % 4 === 0 ? 100 : 110) + r * 82} width="8" height="10" fill="#fff" />
      </g>)}
    </g>)}
    <path d="M10 300 q 80 -40 150 0 t 150 0 t 100 -10" stroke="#ffb300" strokeWidth="5" fill="none" />
  </svg>
);

export default function Home() {
  useTitulo('Eletro Imperial | Materiais Elétricos em Salto SP', 'Eletro Imperial: loja de materiais elétricos em Salto - SP. Disjuntores, cabos, tomadas, interruptores e iluminação. Peça seu orçamento pelo WhatsApp.');
  const cfg = useCfg();
  const [dest, setDest] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    api('/produtos?destaque=1&limite=8').then((r) => r.itens.length ? r.itens :
      api('/produtos?limite=8&grupos=' + encodeURIComponent('DISJUNTORES|DISP PROTEÇAO|TOMADAS|CABOS E FIOS')).then((x) => x.itens))
      .then(setDest).catch(() => { });
  }, []);
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <span className="selo">Salto – SP</span>
            <h1>ELETRO IMPERIAL</h1>
            <h2>Materiais elétricos para quem entende de elétrica.</h2>
            <p>Produtos, soluções e atendimento especializado para profissionais, empresas e clientes que procuram qualidade e segurança.</p>
            <form className="busca-hero" action="/produtos"><Search size={18} /><input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto, ex.: disjuntor 20A" /><button className="btn btn-amarelo">Buscar</button></form>
            <div className="botoes">
              <Link to="/produtos" className="btn btn-azul">VER PRODUTOS</Link>
              <a className="btn btn-borda" href={wa(cfg.whatsapp, MSG.orcamento)} target="_blank" rel="noreferrer">PEDIR ORÇAMENTO NO WHATSAPP</a>
            </div>
          </div>
          <Painel />
        </div>
      </section>

      <section className="sec"><div className="wrap">
        <h2 className="tit">Encontre o que você precisa</h2>
        <CategoriasGrid />
      </div></section>

      <section className="sec cinza"><div className="wrap">
        <h2 className="tit">Produtos em destaque</h2>
        <div className="grade-prod">{dest.map((p) => <ProdutoCard key={p.id} p={p} />)}</div>
        <p className="centro"><Link to="/produtos" className="btn btn-azul">VER CATÁLOGO COMPLETO</Link></p>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="cta-orc">
          <div>
            <h2>Precisa de uma cotação?</h2>
            <p>Envie sua lista de materiais para a Eletro Imperial e nossa equipe prepara seu orçamento.</p>
            <a className="btn btn-amarelo grande" href={wa(cfg.whatsapp, MSG.orcamento)} target="_blank" rel="noreferrer"><MessageCircle /> ENVIAR LISTA PELO WHATSAPP</a>
          </div>
          <FormOrcamento />
        </div>
      </div></section>

      <section className="sec cinza"><div className="wrap duas">
        <div className="card-info">
          <HardHat size={36} /><h2>Feito para quem trabalha com elétrica</h2>
          <p>Na Eletro Imperial você encontra materiais para instalações residenciais, comerciais e industriais, com atendimento pensado para eletricistas, instaladores, empresas e profissionais do setor.</p>
          <div className="botoes"><Link to="/orcamento" className="btn btn-azul">FAZER COTAÇÃO</Link>
            <a className="btn btn-borda-esc" href={wa(cfg.whatsapp, MSG.duvida)} target="_blank" rel="noreferrer">FALAR COM UM VENDEDOR</a></div>
        </div>
        <div className="card-info escuro">
          <Building2 size={36} /><h2>Compras para empresas</h2>
          <ul><li>Cotações</li><li>Compras em quantidade</li><li>Atendimento personalizado</li><li>Fornecimento de materiais elétricos</li><li>Orçamentos para empresas</li><li>Atendimento profissional</li></ul>
          <a className="btn btn-amarelo" href={wa(cfg.whatsapp, MSG.empresa)} target="_blank" rel="noreferrer">SOLICITAR COTAÇÃO</a>
        </div>
      </div></section>

      <section className="sec"><div className="wrap">
        <h2 className="tit">Mundo da Elétrica</h2>
        <div className="grade-blog">{POSTS.slice(0, 3).map((p) => <Link to="/mundo-da-eletrica" key={p.titulo} className="post"><small>{p.cat}</small><h3>{p.titulo}</h3><p>{p.texto.slice(0, 110)}…</p></Link>)}</div>
      </div></section>

      <section className="sec cinza"><div className="wrap duas">
        <div><h2 className="tit esq">Venha até a Eletro Imperial</h2>
          <address><MapPin size={16} /> <b>Avenida Walter Nardelli, 682<br />Parque Imperial<br />Salto – SP<br />CEP 13323-760</b></address>
          <Horarios /><p><a className="btn btn-azul" href={MAPS} target="_blank" rel="noreferrer">COMO CHEGAR</a></p></div>

        <iframe
          title="Localização da Eletro Imperial no Google Maps"
          className="mapa"
          loading="lazy"
          src="https://maps.google.com/maps?q=Av.%20Walter%20Nardelli%2C%20682%2C%20Parque%20Imperial%2C%20Salto%2C%20SP%2C%2013323-760&output=embed"
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

      </div></section>
    </>
  );
}
