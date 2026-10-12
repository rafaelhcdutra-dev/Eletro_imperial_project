import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// Conta de cliente (opcional): o site funciona normalmente sem login.
const Ctx = createContext({ cliente: null });
export const useConta = () => useContext(Ctx);

export function ContaProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('ei_cliente') || '');
  const [cliente, setCliente] = useState(null);

  function sair() { localStorage.removeItem('ei_cliente'); setToken(''); setCliente(null); }
  function guardar(r) { localStorage.setItem('ei_cliente', r.token); setToken(r.token); setCliente(r.cliente); }

  useEffect(() => {
    if (!token) return;
    api('/clientes/me', { token }).then(setCliente).catch(sair);
  }, [token]);

  const valor = {
    cliente,
    entrar: async (body) => guardar(await api('/clientes/login', { method: 'POST', body })),
    cadastrar: async (body) => guardar(await api('/clientes/cadastro', { method: 'POST', body })),
    atualizar: async (body) => setCliente(await api('/clientes/me', { method: 'PUT', token, body })),
    sair,
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
