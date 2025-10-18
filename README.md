Perfeito! Vamos organizar uma **collection para o Insomnia** com todos os endpoints que você já tem: Auth, Users e Feedback. Vou detalhar as requisições para que você só precise importar e testar.

---

## 1️⃣ Auth Endpoints

### **Registro de usuário**

* **Método:** POST
* **URL:** `http://localhost:4000/api/auth/register`
* **Body (JSON):**

```json
{
  "email": "test@example.com",
  "username": "testuser",
  "password": "123456"
}
```

* **Resposta esperada:**

```json
{
  "id": 1,
  "email": "test@example.com",
  "username": "testuser"
}
```

---

### **Login**

* **Método:** POST
* **URL:** `http://localhost:4000/api/auth/login`
* **Body (JSON):**

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

* **Resposta esperada:**

```json
{
  "accessToken": "<JWT_TOKEN>",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "username": "testuser"
  }
}
```

---

## 2️⃣ Users Endpoints

> **Observação:** Para endpoints que exigem autenticação, use o token JWT do login no Header `Authorization: Bearer <JWT_TOKEN>`

### **Atualizar perfil**

* **Método:** PUT
* **URL:** `http://localhost:4000/api/users/profile`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Body (JSON):**

```json
{
  "name": "Luís Rosada",
  "bio": "Fullstack Developer"
}
```

---

### **Criar link**

* **Método:** POST
* **URL:** `http://localhost:4000/api/users/links`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Body (JSON):**

```json
{
  "title": "Meu Portfólio",
  "url": "https://meuportfolio.com"
}
```

---

### **Listar links**

* **Método:** GET
* **URL:** `http://localhost:4000/api/users/links`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```

---

### **Atualizar link**

* **Método:** PUT
* **URL:** `http://localhost:4000/api/users/links/:id`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Body (JSON):**

```json
{
  "title": "Portfolio Atualizado",
  "url": "https://meuportfolio.com/novo"
}
```

---

### **Deletar link**

* **Método:** DELETE
* **URL:** `http://localhost:4000/api/users/links/:id`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```

---

### **Buscar usuário pelo username**

* **Método:** GET
* **URL:** `http://localhost:4000/api/users/:username`

---

## 3️⃣ Feedback Endpoints

### **Criar feedback para usuário**

* **Método:** POST
* **URL:** `http://localhost:4000/api/feedback/:username`
* **Headers:**

  ```
  Authorization: Bearer <JWT_TOKEN>
  ```
* **Body (JSON):**

```json
{
  "text": "Ótimo trabalho!"
}
```

---

### **Listar todos feedbacks**

* **Método:** GET
* **URL:** `http://localhost:4000/api/feedback`

---

Se quiser, posso gerar **um arquivo `.json` pronto para importar no Insomnia**, já com todos os endpoints, headers e exemplos de body.
Quer que eu faça isso?
