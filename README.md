# 💰 Despesas Fábio

App de controle de despesas pessoais com React + Supabase + Vercel.

## 🚀 Deploy em 3 passos

### 1. Supabase — Criar as tabelas

1. Acesse [supabase.com](https://supabase.com) → seu projeto
2. Vá em **SQL Editor** → **New Query**
3. Cole o conteúdo do arquivo `schema.sql` e clique em **Run**
4. As 3 tabelas serão criadas: `contas_pagar`, `fornecedores`, `categorias`

### 2. GitHub — Subir o código

```bash
# Na pasta do projeto:
git init
git add .
git commit -m "Initial commit - Despesas Fábio"
git branch -M main

# Crie um repositório no GitHub (github.com/new) e então:
git remote add origin https://github.com/SEU_USUARIO/despesas-fabio.git
git push -u origin main
```

### 3. Vercel — Deploy automático

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = `https://bpoxytfsmtblpspmoijv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGci...` (sua chave anon)
4. Clique em **Deploy**
5. Em ~1 minuto seu app estará em `despesas-fabio.vercel.app` 🎉

## 🛠️ Desenvolvimento local

```bash
npm install
npm run dev
```

## 📁 Estrutura

```
despesas-fabio/
├── src/
│   ├── App.jsx        # App principal
│   ├── supabase.js    # Cliente Supabase
│   └── main.jsx       # Entry point
├── index.html
├── schema.sql         # SQL para criar as tabelas
├── .env               # Variáveis de ambiente (não subir no GitHub!)
├── .env.example       # Template das variáveis
└── package.json
```
