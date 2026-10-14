import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { MapPin, Menu, MessageCircle, Phone, Instagram, X, Zap } from 'lucide-react';
import { api } from './api.js';
import { wa, MSG } from './whatsapp.js';
import Home from './pages/Home.jsx';
import Catalogo from './pages/Catalogo.jsx';
import { Categorias, Orcamento, Sobre, Blog, Contato } from './pages/Paginas.jsx';
import Admin from './pages/Admin.jsx';
import Conta from './pages/Conta.jsx';
import { ContaProvider, useConta } from './conta.jsx';

const PADRAO = { whatsapp: '551140292918', telefone: '(11) 4029-2918', horario_semana: '08:00 às 18:00', horario_sabado: '08:00 às 16:00', instagram: '' };
const Cfg = createContext(PADRAO);
export const useCfg = () => useContext(Cfg);

export const MAPS = 'https://www.google.com/maps?rlz=1C1GCEA_pt-BRBR1201BR1202&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTISCAEQLhgNGK8BGMcBGIAEGI4FMgkIAhAAGA0YgAQyCAgDEAAYDRgeMggIBBAAGA0YHjIICAUQABgNGB4yCggGEAAYCBgNGB4yCggHEAAYCBgNGB4yCggIEAAYCBgNGB7SAQg0MDM0ajBqN6gCCLACAfEFVW-ge27RNqo&um=1&ie=UTF-8&fb=1&gl=br&sa=X&geocode=KfOQIpNVT8-UMZV_NcyEWdER&daddr=Av.+Walter+Nardelli,+682+-+Parque+Imperial,+Salto+-+SP,+13323-760';


export function useTitulo(t, d) {
  useEffect(() => {
    document.title = t;
    if (d) document.querySelector('meta[name=description]')?.setAttribute('content', d);
    window.scrollTo(0, 0);
  }, [t, d]);
}

const LINKS = [['/', 'Início'], ['/produtos', 'Produtos'], ['/categorias', 'Categorias'], ['/orcamento', 'Orçamento'], ['/sobre', 'Sobre nós'], ['/mundo-da-eletrica', 'Mundo da Elétrica'], ['/contato', 'Contato']];


export const Logo = () => (
  <Link to="/" className="logo" aria-label="Eletro Imperial — página inicial">
    <img
      src="/logo-img.jpeg"
      alt=""
      className="logo-img"
    />
    <span>ELETRO<b>IMPERIAL</b></span>
  </Link>
);


function Layout({ children }) {
  const cfg = useCfg();
  const { cliente } = useConta();
  const [aberto, setAberto] = useState(false);
  const loc = useLocation();
  useEffect(() => setAberto(false), [loc]);
  return (
    <>
      <header className="topo">
        <div className="wrap topo-in">
          <Logo />
          <nav className={aberto ? 'nav aberto' : 'nav'}>
            {LINKS.slice(0, 6).map(([to, t]) => <NavLink key={to} to={to} end={to === '/'}>{t}</NavLink>)}
            <NavLink to="/conta">{cliente ? `Olá, ${cliente.nome.split(' ')[0]}` : 'Entrar'}</NavLink>
            <a className="btn btn-azul sm" href={wa(cfg.whatsapp, MSG.orcamento)} target="_blank" rel="noreferrer">Orçamento no WhatsApp</a>
          </nav>
          <button className="menu-btn" onClick={() => setAberto(!aberto)} aria-label="Menu">{aberto ? <X /> : <Menu />}</button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="rodape">
        <div className="wrap grid-rodape">
          <div>
            <Logo />
            <p>Materiais Elétricos<br />Salto – SP</p>
            <p><Phone size={14} /> Telefone/WhatsApp:<br /><b>{cfg.telefone}</b></p>
            <div className="redes">
              <a href={wa(cfg.whatsapp, MSG.duvida)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle /></a>
              {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>}
              <a href={MAPS} target="_blank" rel="noreferrer" aria-label="Google Maps"><MapPin /></a>
            </div>
          </div>
          <div className="links-rodape">{LINKS.map(([to, t]) => <Link key={to} to={to}>{t}</Link>)}</div>
        </div>
        <div className="copy">© {new Date().getFullYear()} Eletro Imperial – Materiais Elétricos – Salto/SP</div>
      </footer>
      <a className="zap-flutuante" href={wa(cfg.whatsapp, MSG.duvida)} target="_blank" rel="noreferrer">
        <MessageCircle /><span>Fale conosco pelo WhatsApp</span>
      </a>
    </>
  );
}

export default function App() {
  const [cfg, setCfg] = useState(PADRAO);
  useEffect(() => { api('/config').then((c) => setCfg({ ...PADRAO, ...c })).catch(() => {}); }, []);
  return (
    <Cfg.Provider value={cfg}>
      <ContaProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<Catalogo />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/orcamento" element={<Orcamento />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/mundo-da-eletrica" element={<Blog />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
      </ContaProvider>
    </Cfg.Provider>
  );
}
