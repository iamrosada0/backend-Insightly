
# README - MVP Plataforma "Insightly"

## 🏢 Contexto do Projeto

**Insightly** é uma startup fictícia que permite criadores de conteúdo:

* Criar uma página pública com links das suas redes sociais.
* Receber feedback anônimo de seus seguidores.

O MVP foi desenvolvido com foco em **simplicidade, escalabilidade e SEO**, contemplando três pilares principais: autenticação, página pública e feedback.

---

## 📝 Objetivo do Exercício

O desafio consistiu em construir do zero um **MVP funcional**, tomando decisões de arquitetura, implementando funcionalidades core e preparando a infraestrutura para deploy.

---

## 🛠 Tecnologias Utilizadas

| Camada         | Tecnologia                | Justificativa                                                       |
| -------------- | ------------------------- | ------------------------------------------------------------------- |
| Backend        | NestJS + TypeScript       | Estrutura modular, suporte a REST e fácil testabilidade             |
| Frontend       | NextJS + TypeScript (SSR) | SSR/SSG nativo para SEO, integração simples com API                 |
| Banco de Dados | PostgreSQL                | Relacional, confiável, escalável                                    |
| Infraestrutura | AWS (EC2, ALB)            | Deploy rápido, balanceamento de carga, monitoramento via CloudWatch |
| Segurança      | HTTPS via ACM + Nginx     | Criptografia TLS, segurança do tráfego                              |
| Testes         | Jest (unitários NestJS)   | Garantia de qualidade e cobertura das principais funcionalidades    |

---

## ⚙️ Arquitetura do MVP

O diagrama abaixo mostra o fluxo principal da aplicação:

![alt text](image.png)

**Decisões importantes na arquitetura:**

* **SSR via Next.js**: garante SEO otimizado para páginas públicas e carregamento rápido.
* **ALB (Load Balancer)**: permite escalabilidade futura do backend NestJS e health checks automáticos.
* **Banco de dados PostgreSQL**: escolhida por confiabilidade e suporte a relacionamentos complexos entre usuários, links e feedbacks.
* **Frontend e backend no mesmo EC2 (inicialmente)**: simplifica deploy e gerenciamento de infraestrutura.

---

## 🖥 Funcionalidades Implementadas

### Sistema de Autenticação e Gestão de Perfil

* Registro/login via email e senha.
* Edição de perfil: nome, biografia.
* CRUD de links: título + URL.

### Página de Perfil Pública

* URL única para cada usuário (`/username`).
* Renderizada via SSR para SEO.
* Exibe nome, biografia e lista de links.
* Feedback anônimo: qualquer visitante pode enviar mensagens.

### Sistema de Feedback

* Feedbacks armazenados no banco e apresentados ao criador logado.
* Ordenação do mais recente para o mais antigo.

---

## 🔧 Infraestrutura e Deploy

* **EC2 Ubuntu**: hospeda backend e frontend SSR.
* **ALB**: roteia requisições da API para backend e monitora saúde da instância.
* **Nginx**: opcional, usado para unificar backend + frontend e HTTPS.
* **HTTPS via ACM**: segurança de tráfego.

**Fluxo de deploy:**

1. Instalar dependências no backend e frontend.
2. Rodar backend NestJS (`npm run start:dev`).
3. Rodar frontend Next.js SSR (`npm run dev`).
4. Configurar ALB para rotear `/api` para porta 4000 do backend.

---

## 💡 Decisões Estratégicas

1. **SSR para SEO**: essencial para páginas públicas de criadores.
2. **Separação de frontend/backend**: permite escalabilidade e testes independentes.
3. **AWS EC2 + ALB**: simples, confiável e permite escalabilidade futura.
4. **PostgreSQL relacional**: garante integridade entre usuários, links e feedbacks.
5. **Testes unitários com Jest**: valida funcionalidades críticas do backend.

---

### 1️⃣ Configuração do Prisma Client

```prisma
generator client {
  provider = "prisma-client-js"
}
```

* Define que o Prisma vai gerar um **client em JavaScript/TypeScript**.
* Esse client é usado no seu código para fazer consultas ao banco sem escrever SQL diretamente.

---

### 2️⃣ Fonte de dados (Database)

```prisma
datasource db {
  provider = "postgresql"
  url     = env("DATABASE_URL")
}
```

* `provider = "postgresql"` indica que o banco é **PostgreSQL**.
* `url = env("DATABASE_URL")` pega a URL de conexão a partir da variável de ambiente `DATABASE_URL`.
* Exemplo de URL:

  ```
  postgresql://usuario:senha@localhost:5432/insightly
  ```

---

### 3️⃣ Modelo `User`

```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String     @unique
  password  String
  username  String     @unique
  name      String?
  bio       String?
  links     Link[]
  feedbacks Feedback[]
  createdAt DateTime   @default(now())

  @@map("users")
}
```

* `id`: chave primária, auto-incrementada.
* `email`: único (não pode repetir).
* `password`: senha do usuário (hash).
* `username`: único, usado na URL pública.
* `name` e `bio`: opcionais (`String?` significa que podem ser nulos).
* `links`: **relação 1:N** com o modelo `Link`. Um usuário pode ter vários links.
* `feedbacks`: **relação 1:N** com o modelo `Feedback`.
* `createdAt`: data de criação, padrão `now()` (hora atual).
* `@@map("users")`: no banco de dados, a tabela se chamará `users`.

---

### 4️⃣ Modelo `Link`

```prisma
model Link {
  id        Int      @id @default(autoincrement())
  title     String
  url       String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  createdAt DateTime @default(now())

  @@map("links")
}
```

* `id`: chave primária, auto-incrementada.
* `title` e `url`: título e URL do link.
* `user`: relação com `User`.

  * `fields: [userId]` → coluna que guarda o id do usuário.
  * `references: [id]` → referencia a coluna `id` da tabela `users`.
  * `onDelete: Cascade` → se o usuário for deletado, os links dele também são deletados automaticamente.
* `userId`: FK (foreign key) do usuário.
* `createdAt`: data de criação.
* `@@map("links")`: tabela no banco se chamará `links`.

---

### 5️⃣ Modelo `Feedback`

```prisma
model Feedback {
  id        Int      @id @default(autoincrement())
  text      String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    Int
  createdAt DateTime @default(now())

  @@map("feedbacks")
}
```

* `id`: chave primária.
* `text`: texto do feedback.
* `user`: relação com `User`, mesma lógica do Link.
* `userId`: FK do usuário.
* `createdAt`: data de criação.
* `onDelete: Cascade` garante que se o usuário for deletado, os feedbacks dele também desaparecem.
* `@@map("feedbacks")`: tabela no banco se chamará `feedbacks`.

---

### 6️⃣ Resumo das relações

* **User → Link**: 1 usuário tem N links (`links: Link[]`).
* **User → Feedback**: 1 usuário tem N feedbacks (`feedbacks: Feedback[]`).
* **Exclusão em cascata**: ao deletar um usuário, **todos os links e feedbacks dele são deletados**.

---
![alt text](image2.png)


---

## 🔹 Fluxo de comunicação na aplicação

### 1️⃣ Usuário/Browser (Client)

* O usuário acessa uma URL pública, por exemplo:

  ```
  https://insightly.com/username
  ```
* Esse acesso gera uma requisição HTTP(S) para o **Next.js**, que vai renderizar a página.

---

### 2️⃣ Next.js (SSR Frontend)

* O **Next.js** está configurado para SSR (Server-Side Rendering), então:

  1. Recebe a requisição do usuário.
  2. Faz uma requisição interna ao **NestJS API** para buscar dados do perfil (`GET /api/profile/:username`).
  3. Monta a página HTML completa com os dados do usuário.
  4. Retorna o HTML renderizado ao usuário.

> A vantagem do SSR é que a página já chega renderizada, melhorando SEO e performance inicial.

---

### 3️⃣ Application Load Balancer (ALB)

* Quando o Next.js precisa enviar **requisições à API** (por exemplo, envio de feedback), o fluxo passa pelo **ALB**.
* O ALB atua como **balanceador de carga**:

  * Recebe requisições em uma porta pública (HTTP/HTTPS).
  * Roteia essas requisições para o(s) backend(s) NestJS, normalmente via **Target Group**.
  * Faz health checks periódicos para garantir que o backend está ativo.

Exemplo de requisição de feedback:

![alt text](image-1.png)


---

### 4️⃣ NestJS (Backend)

* O **NestJS** recebe a requisição roteada pelo ALB.
* Processa a lógica de negócio:

  * Valida dados do usuário.
  * Interage com o banco de dados para criar, ler ou atualizar registros.
* Retorna a resposta para o ALB (caso a requisição tenha passado por ele).

> Ex.: Ao enviar um feedback: NestJS insere o feedback no banco e retorna status `200 OK`.

---

### 5️⃣ PostgreSQL (Banco de Dados)

* Todas as informações persistentes (usuários, links, feedbacks) ficam no PostgreSQL.
* O NestJS faz consultas SQL via **Prisma Client**:

  * `SELECT profile WHERE username=:username`
  * `INSERT INTO feedbacks ...`
* Resposta do banco volta para o NestJS, que processa e envia para o frontend (ou ALB).

---

### 🔹 Fluxo resumido

#### A) Carregamento de página pública

![alt text](image-1.png)

* Next.js recebe dados do NestJS e retorna **HTML renderizado**.

#### B) Submissão de feedback

![alt text](image-2.png)

* ALB distribui a requisição para backend ativo.
* NestJS grava feedback no banco e retorna confirmação.
* Confirmação retorna pelo ALB e Next.js para o usuário.

---

### 🔹 Observações importantes

1. **SSR + API interna**: Next.js pode chamar o backend diretamente sem expor a API ao usuário, mas para endpoints públicos (feedback) usamos ALB.
2. **Escalabilidade**:

   * Se houver múltiplas instâncias do NestJS, o ALB distribui as requisições.
3. **Segurança**:

   * HTTPS obrigatório.
   * ALB pode bloquear tráfego não autorizado.
4. **Cascata de exclusão**: Ex.: ao deletar um usuário, links e feedbacks são removidos automaticamente pelo banco (Prisma `onDelete: Cascade`).

---


![alt text](image_3.png)

---
# Test
![alt text](image-3.png)


Perfeito! Aqui está uma versão atualizada e completa do seu README, já incluindo a seção de **rodar localmente com Docker Compose** integrada com toda a documentação, arquitetura e explicações de fluxo:

---

# README - MVP Plataforma "Insightly"

## 🏢 Contexto do Projeto

**Insightly** é uma startup fictícia que permite criadores de conteúdo:

* Criar uma página pública com links das suas redes sociais.
* Receber feedback anônimo de seus seguidores.

O MVP foi desenvolvido com foco em **simplicidade, escalabilidade e SEO**, contemplando três pilares principais: autenticação, página pública e feedback.

---

## 📝 Objetivo do Exercício

O desafio consistiu em construir do zero um **MVP funcional**, tomando decisões de arquitetura, implementando funcionalidades core e preparando a infraestrutura para deploy.

---

## 🛠 Tecnologias Utilizadas

| Camada         | Tecnologia                | Justificativa                                                       |
| -------------- | ------------------------- | ------------------------------------------------------------------- |
| Backend        | NestJS + TypeScript       | Estrutura modular, suporte a REST e fácil testabilidade             |
| Frontend       | NextJS + TypeScript (SSR) | SSR/SSG nativo para SEO, integração simples com API                 |
| Banco de Dados | PostgreSQL                | Relacional, confiável, escalável                                    |
| Infraestrutura | AWS (EC2, ALB)            | Deploy rápido, balanceamento de carga, monitoramento via CloudWatch |
| Segurança      | HTTPS via ACM + Nginx     | Criptografia TLS, segurança do tráfego                              |
| Testes         | Jest (unitários NestJS)   | Garantia de qualidade e cobertura das principais funcionalidades    |

---

## ⚙️ Arquitetura do MVP

O diagrama abaixo mostra o fluxo principal da aplicação:

![alt text](image.png)


**Fluxo de deploy:**

1. Instalar dependências no backend e frontend.
2. Rodar backend NestJS (`npm run start:dev`).
3. Rodar frontend Next.js SSR (`npm run dev`).
4. Configurar ALB para rotear `/api` para porta 4000 do backend.

---

## 💡 Decisões Estratégicas

1. **SSR para SEO**: essencial para páginas públicas de criadores.
2. **Separação de frontend/backend**: permite escalabilidade e testes independentes.
3. **AWS EC2 + ALB**: simples, confiável e permite escalabilidade futura.
4. **PostgreSQL relacional**: garante integridade entre usuários, links e feedbacks.
5. **Testes unitários com Jest**: valida funcionalidades críticas do backend.

---


## Rodando Backend e Banco de Dados com Docker Compose

Para rodar a aplicação localmente usando Docker, com apenas o backend e o banco de dados PostgreSQL, siga os passos:

1. Certifique-se de estar na pasta onde o arquivo `docker-compose.yml` está salvo (ex: raiz do projeto).

2. No terminal, execute o comando para subir os containers:

```bash
docker-compose up --build
```

3. Aguarde até que o PostgreSQL e o backend estejam rodando.

4. A API do backend ficará disponível em:

```
http://localhost:4000/api
```

5. Para parar e remover os containers, use:

```bash
docker-compose down
```

---

**Importante:**
No backend, a conexão com o banco usa o hostname `db` (nome do serviço do banco no Docker Compose). Não altere o `DATABASE_URL` para `localhost` quando estiver rodando via Docker Compose.

---

Isso vai iniciar:

* **PostgreSQL**: porta `5432`
* **Backend NestJS**: porta `4000`
* **Frontend NextJS**: porta `3000`


> Observação: Prisma vai gerar o client e aplicar migrações automaticamente quando o backend subir.

---




---

### 📦 Arquivo `.env` do Backend (NestJS)

Crie um arquivo chamado `.env` dentro da pasta `backend-Insightly` com o seguinte conteúdo:

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/insightly?schema=public
PORT=4000
NODE_ENV=development

JWT_SECRET=MGs9sN82d@kL93nZ!2vBnKmW03bVc7xq
```

### Estrutura de pastas (Frontend)

```
──public
└───src
    ├───app
    │   ├───auth
    │   │   ├───login
    │   │   └───register
    │   ├───feedbacks
    │   ├───profile
    │   │   ├───edit
    │   │   └───links
    │   │       ├───new
    │   │       └───[id]
    │   │           └───edit
    │   └───[username]
    ├───components
    │   └───ui
    ├───hooks
    ├───lib
    └───types
```

---

### Links do repositório

* Backend: [https://github.com/iamrosada0/backend-Insightly](https://github.com/iamrosada0/backend-Insightly)
* Frontend: [https://github.com/iamrosada0/frontend-Insightly](https://github.com/iamrosada0/frontend-Insightly)
> ⚡ **Swagger:** Depois que o backend subir, você pode acessar a documentação da API via Swagger em:
> [http://localhost:4000/docs#/users/UsersController_getPublicProfile](http://localhost:4000/docs#/users/UsersController_getPublicProfile)

> Observação: Prisma vai gerar o client e aplicar migrações automaticamente quando o backend subir.
---

