export const wa = (numero, msg) => `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
export const MSG = {
  orcamento: 'Olá, gostaria de solicitar um orçamento na Eletro Imperial.',
  produto: (nome, codigo) => `Olá, gostaria de consultar o preço do produto ${nome}${codigo ? ` (cód. ${codigo})` : ''}.`,
  empresa: 'Olá, represento uma empresa e gostaria de solicitar uma cotação de materiais elétricos.',
  duvida: 'Olá, tenho uma dúvida sobre materiais elétricos.',
  lista: ({ nome, empresa, lista, observacoes }) =>
    `Olá, sou ${nome}${empresa ? ` da empresa ${empresa}` : ''} e gostaria de um orçamento:\n\n${lista}${observacoes ? `\n\nObservações: ${observacoes}` : ''}`,
};
