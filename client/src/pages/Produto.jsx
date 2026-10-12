import { Zap } from 'lucide-react';
import { reais } from '../api.js';
import { wa, MSG } from '../whatsapp.js';
import { useCfg } from '../App.jsx';

export default function ProdutoCard({ p }) {
  const cfg = useCfg();
  const spec = p.especificacao || [p.subgrupo, p.referencia && `Ref. ${p.referencia}`, p.unidade && `Venda por ${p.unidade}`].filter(Boolean).join(' • ');
  return (
    <article className="prod">
      <div className="prod-img">{p.imagem_url ? <img src={p.imagem_url} alt={p.descricao} loading="lazy" /> : <Zap size={40} />}</div>
      <h3>{p.descricao}</h3>
      {p.marca && <div className="marca">{p.marca}</div>}
      {spec && <div className="spec">{spec}</div>}
      <div className="cod">Cód. {p.codigo}</div>
      <div className={p.preco ? 'preco' : 'preco consulte'}>{p.preco ? reais(p.preco) : 'Consulte o preço'}</div>
      <a className="btn btn-azul" href={wa(cfg.whatsapp, MSG.produto(p.descricao, p.codigo))} target="_blank" rel="noreferrer">Pedir orçamento</a>
    </article>
  );
}
