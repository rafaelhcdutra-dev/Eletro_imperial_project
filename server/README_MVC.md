# Servidor Eletro Imperial — organização

- `server.js`: inicialização, conexão ao MySQL, criação opcional do administrador inicial e encerramento seguro.
- `app.js`: configuração Express, middleware e registro dos endpoints existentes da API.
- `db.js`: pool e estrutura inicial do banco.
- `planilha.js`: leitura/importação de planilhas.
- `scripts/`: tarefas administrativas.

O bootstrap foi separado da aplicação para facilitar a migração gradual para MVC sem quebrar as rotas já usadas pelo frontend. Os endpoints atuais permanecem em `app.js`; portanto, esta entrega é uma etapa segura de organização, não uma extração completa de cada endpoint em controller/model separado.

## Inicialização
1. Copie `.env.example` para `.env` e preencha as credenciais locais.
2. `npm install`
3. `npm run dev`
4. Teste `http://localhost:3001/api/health`.

Nunca envie o `.env` para repositórios públicos ou ZIPs compartilhados.
