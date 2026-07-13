# Cowculadora — Sistema de Gestão de Confinamento Bovino

Sistema web para gerenciar animais em confinamento. Feito com React no frontend e Node.js no backend.

---

## O que o sistema faz

- Cadastro de animais com brinco, raça, sexo e data de nascimento
- Registro de pesagens vinculadas ao animal
- Cálculo automático de GMD (Ganho Médio Diário)
- Gráfico de evolução de peso por animal
- Dashboard com visão geral do rebanho
- Gestão de lotes
- Controle de medicamentos com alertas de carência
- Módulo financeiro com valor do rebanho e projeções
- Agenda de manejo (vacinas, pesagens, vendas)
- Controle de insumos (ração, silagem, etc.) com custo total

---

## Tecnologias usadas

**Frontend**
- React
- Chart.js (gráficos)
- Axios (requisições HTTP)

**Backend**
- Node.js
- Express
- MySQL
- JWT (autenticação)
- Bcrypt (criptografia de senha)

---

## Como rodar o projeto

### Pré-requisitos
- Node.js instalado
- MySQL instalado e rodando

### 1. Clone o repositório
```bash
git clone https://github.com/Diasx7/Cowculadora.git
cd Cowculadora
```

### 2. Configure o banco de dados
- Crie um banco chamado `cowculadora` no MySQL
- Rode os arquivos `.sql` que estão na pasta do projeto para criar as tabelas

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz com:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=cowculadora
JWT_SECRET=seu_segredo
```

### 4. Instale as dependências do backend
```bash
npm install
```

### 5. Instale as dependências do frontend
```bash
cd frontend
npm install
```

### 6. Rode o projeto

Backend (na raiz):
```bash
node server.js
```

Frontend (na pasta frontend):
```bash
npm start
```

O frontend vai rodar em `http://localhost:3000` e o backend em `http://localhost:3001`.

---

## Estrutura do projeto

```
cowculadora/
├── controllers/       # Lógica das rotas
├── routes/            # Definição das rotas
├── models/            # Modelos do banco
├── middleware/        # Autenticação JWT
├── config/            # Conexão com o banco
├── frontend/          # Aplicação React
│   └── src/
│       └── Pages/     # Telas da aplicação
└── server.js          # Arquivo principal do backend
```

---

## Autor

Feito por [João Pablo](https://github.com/Diasx7)
