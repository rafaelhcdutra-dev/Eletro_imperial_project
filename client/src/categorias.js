import { Cable, Zap, PlugZap, Box, Lightbulb, Wrench, Cpu, ShieldCheck, Factory, BatteryCharging, Layers, Cog } from 'lucide-react';
// Cada card do site agrupa os grupos reais da planilha de produtos.
export const CATEGORIAS = [
  { nome: 'Fios e Cabos', icone: Cable, grupos: ['CABOS E FIOS', 'EXTENÇOES'] },
  { nome: 'Disjuntores', icone: Zap, grupos: ['DISJUNTORES'] },
  { nome: 'Tomadas e Interruptores', icone: PlugZap, grupos: ['TOMADAS', 'INTERRUPTORES', 'MODULOS', 'PLACAS', 'PLUGS', 'ADAPTADORES'] },
  { nome: 'Quadros e Caixas', icone: Box, grupos: ['QDC', 'CAIXA LUZ', 'CAIXINHA LUZ'] },
  { nome: 'Iluminação', icone: Lightbulb, grupos: ['ILUMINACAO', 'LAMPADAS', 'REFLETORES', 'SPOTS', 'PERFIL LED', 'LUMINARIAS', 'SOQUETES'] },
  { nome: 'Materiais para Instalação', icone: Layers, grupos: ['ELETRODUTO FLEX', 'ELETRODUTO RIG', 'INFRAESTRUTURA', 'ABRACADEIRAS', 'BUCHAS', 'FIXAÇÃO', 'SUPORTES', 'FITAS'] },
  { nome: 'Conectores e Terminais', icone: Cog, grupos: ['CONECTORES', 'TERMINAIS'] },
  { nome: 'Ferramentas', icone: Wrench, grupos: ['FERRAMENTAS MANUAIS', 'FERRAMENTAS ELETRICAS', 'SERRA', 'DISCO', 'BROCAS', 'LAMINA'] },
  { nome: 'Materiais Industriais', icone: Factory, grupos: ['INDUSTRIAL', 'BARRAMENTOS', 'ISOLADORES', 'RESISTENCIAS'] },
  { nome: 'Automação', icone: Cpu, grupos: ['SENSORES', 'TIMER DIGITAL', 'FONTE'] },
  { nome: 'Proteção Elétrica', icone: ShieldCheck, grupos: ['DISP PROTEÇAO', 'FUSIVEL', 'EPI', 'LUVA'] },
  { nome: 'Carregadores para veículos elétricos', icone: BatteryCharging, grupos: [], whatsapp: true },
];
