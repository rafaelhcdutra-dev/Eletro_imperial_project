import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, nomeGrupo } from '../api.js';
import { useTitulo } from '../App.jsx';
import ProdutoCard from './Produto.jsx';

export default function Catalogo() {
  useTitulo('Catálogo de materiais elétricos | Eletro Imperial – Salto SP', 'Pesquise disjuntores, cabos, tomadas, interruptores, iluminação e outros materiais elétricos na Eletro Imperial, Salto SP.');
  const [sp, setSp] = useSearchParams();
  const [busca, setBusca] = useState(sp.get('q') || '');
  const [grupos, setGrupos] = useState([]);
  const [dados, setDados] = useState({ itens: [], total: 0, paginas: 1 });
  const [carregando, setCarregando] = useState(true);
  const q = sp.get('q') || '', gs = sp.get('grupos') || '', pagina = +(sp.get('pagina') || 1), cat = sp.get('cat');

  useEffect(() => { api('/grupos').then(setGrupos).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => { if (busca !== q) mudar({ q: busca, pagina: 1 }); }, 350);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => {
    setCarregando(true);
    api(`/produtos?q=${encodeURIComponent(q)}&grupos=${encodeURIComponent(gs)}&pagina=${pagina}`)
      .then(setDados).catch(() => {}).finally(() => setCarregando(false));
  }, [q, gs, pagina]);

  function mudar(novo) {
    const n = new URLSearchParams(sp);
    Object.entries(novo).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setSp(n, { replace: true });
  }
  const unico = gs && !gs.includes('|') ? gs : '';

  return (
    <section className="sec"><div className="wrap">
      <h1 className="tit">{cat || 'Catálogo de produtos'}</h1>
      <div className="filtros">
        <input type="search" placeholder="Pesquisar produto pelo nome ou código..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select value={unico} onChange={(e) => mudar({ grupos: e.target.value, cat: '', pagina: 1 })}>
          <option value="">{gs && !unico ? (cat || 'Categoria selecionada') : 'Todas as categorias'}</option>
          {grupos.map((g) => <option key={g.grupo} value={g.grupo}>{nomeGrupo(g.grupo)} ({g.total})</option>)}
        </select>
        {(q || gs) && <button className="btn btn-borda-esc sm" onClick={() => { setBusca(''); setSp({}); }}>Limpar filtros</button>}
      </div>
      <p className="contagem">{carregando ? 'Carregando...' : `${dados.total} produto(s) encontrado(s)`}</p>
      <div className="grade-prod">{dados.itens.map((p) => <ProdutoCard key={p.id} p={p} />)}</div>
      {!carregando && !dados.itens.length && <p className="centro">Nenhum produto encontrado. Fale com a gente pelo WhatsApp que procuramos para você.</p>}
      {dados.paginas > 1 && (
        <div className="paginacao">
          <button className="btn btn-borda-esc sm" disabled={pagina <= 1} onClick={() => mudar({ pagina: pagina - 1 })}>← Anterior</button>
          <span>Página {pagina} de {dados.paginas}</span>
          <button className="btn btn-borda-esc sm" disabled={pagina >= dados.paginas} onClick={() => mudar({ pagina: pagina + 1 })}>Próxima →</button>
        </div>
      )}
    </div></section>
  );
}
