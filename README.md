# 🎓 EduFocus - Ecossistema de Inteligência Educacional

> **Transformando câmeras de segurança em ferramentas de gestão pedagógica e engajamento escolar.**

[![Status](https://img.shields.io/badge/status-production-success)](https://github.com/leopalmeira/edufocus1)
[![Python](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3-blue)](https://reactjs.org/)
[![AI](https://img.shields.io/badge/AI-TensorFlow.js-orange)](https://www.tensorflow.org/js)
[![Portaria](https://img.shields.io/badge/Portaria-Geolocalização-blueviolet)](./DOC_PORTARIA_GEO.md)

---

## 📖 O Que é o EduFocus na Prática?

O **EduFocus** não é apenas um sistema de gestão escolar. É uma plataforma de **Inteligência Artificial aplicada** que resolve três dores críticas das instituições de ensino modernas: **Segurança, Controle de Acesso e Saída Estruturada.**

Diferente de sistemas passivos, o EduFocus age ativamente:
1.  **Segurança Ativa:** Identifica quem entra e sai da escola em milissegundos através de reconhecimento facial.
2.  **Portaria Inteligente (GEO):** Notifica a equipe de portaria no exato momento em que o responsável entra em um raio de 500m da escola.
3.  **Pedagogia Baseada em Dados:** Analisa o engajamento e o clima emocional das turmas em tempo real.

Tudo isso rodando em uma arquitetura **Multi-tenant robusta**, permitindo o isolamento total de dados entre diferentes unidades escolares.

---

## 💡 Casos de Uso Reais

### 👪 Para os Pais: "Saída sem Filas e com Segurança"
O responsável não precisa mais esperar em filas duplas ou sair do carro desnecessariamente. Ao se aproximar da escola, o PWA detecta sua posição e permite notificar a portaria:
> **"🚗 Notificar Escola: Estou a 300m e pronto para retirar o Pedro Silva."**

### 🏫 Para a Direção: "Visão de Raio-X da Escola"
O diretor não precisa adivinhar como está o clima escolar. O dashboard mostra em tempo real:
- **Frequência:** 95% dos alunos presentes hoje.
- **Portaria:** Fluxo de saída organizado e sem aglomerações.
- **Segurança:** Alerta imediato de pessoas não autorizadas.

### 👩‍🏫 Para Professores: "Foco no Ensino, Não na Chamada"
O professor entra em sala e começa a aula. A câmera faz a chamada silenciosamente.
- **Zero tempo perdido** gritando nomes.
- **Análise de Engajamento:** O sistema avisa se a turma está perdendo o interesse, permitindo ajustar a didática na hora.

### 🛠️ Para Técnicos e Instaladores: "Instalação Descomplicada"
Painel dedicado para vincular câmeras IP/RTSP a salas específicas com poucos cliques, testar conexões e ajustar ângulos de visão sem precisar acessar o servidor principal.

---

## 🏗️ Arquitetura Técnica Profunda

O sistema foi desenhado para ser escalável, seguro e econômico.

### 1. Núcleo de Inteligência Artificial (Edge AI)
Utilizamos **TensorFlow.js** e **face-api.js** rodando diretamente no navegador (Client-side) ou em servidores de borda.
*   **Privacidade:** As imagens não precisam ser enviadas para nuvens de terceiros (como AWS Rekognition ou Azure), o processamento é local.
*   **Custo Zero:** Não há cobrança por API de reconhecimento facial.
*   **Performance:** Latência mínima, feedback visual em tempo real (< 100ms).

### 2. Sistema de Portaria por Geolocalização
Integramos a Geolocation API nativa para um sistema de "Check-in" de proximidade.
*   **Distância Real:** Cálculo de Haversine entre o responsável e a unidade escolar.
*   **Real-time:** O painel do inspetor de portaria atualiza via polling/SSE (Server-Sent Events) para exibir quem está chegando.

### 3. Multi-tenancy Real (Isolamento Lógico e Físico)
Para garantir que dados da "Escola A" nunca vazem para a "Escola B":
*   **Bancos Isolados:** Cada escola tem seu próprio arquivo SQLite (`school_1.db`, `school_2.db`).
*   **Banco Sistema:** Um banco global (`system.db`) gerencia credenciais e metadados das escolas.

---

### Diagrama de Fluxo de Dados

```mermaid
graph TD
    %% Estilos
    classDef client fill:#3b82f6,stroke:#1d4ed8,color:#fff
    classDef server fill:#10b981,stroke:#047857,color:#fff
    classDef database fill:#f59e0b,stroke:#b45309,color:#fff
    classDef feature fill:#8b5cf6,stroke:#6d28d9,color:#fff

    subgraph Dispositivos [Camada de Cliente]
        Parent[PWA do Responsável]:::client
        Admin[Painel Administrativo React]:::client
        Cam[Câmera IP / Webcam]:::client
        AI[Edge AI: face-api.js]:::feature
        
        Admin <--> AI
        Cam --> Admin
    end

    subgraph Servidor [Backend Python Flask]
        API[Flask REST API]:::server
        Middleware[Auth & Tenant Router]:::server
        Logic[Lógica de Negócio / Portaria]:::server
        
        API --- Middleware
        Middleware --- Logic
    end

    subgraph Dados [Persistência Multi-tenant]
        SystemDB[(system.db)]:::database
        SchoolDBs{Roteador de Bancos}:::database
        DB1[(school_1.db)]:::database
        DB2[(school_2.db)]:::database
        
        Logic --> SystemDB
        Logic --> SchoolDBs
        SchoolDBs --> DB1
        SchoolDBs --> DB2
    end

    %% Fluxos de Interação
    Parent -->|GPS Check-in| API
    Admin -->|HTTPS / JSON| API
    Logic -->|Real-time Update| Admin
    
    %% Legenda de Fluxos
    Logic -.->|Notifica Inspetor| Admin
    Admin -.->|Libera Aluno| Logic
    Logic -.->|Status da Retirada| Parent
```

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura e Tecnologias](#-arquitetura-e-tecnologias)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Regras de Negócio](#-regras-de-negócio)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Fluxos do Sistema](#-fluxos-do-sistema)
- [API e Endpoints](#-api-e-endpoints)
- [Segurança](#-segurança)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## ✨ Funcionalidades Principais

### 1. 📸 Reconhecimento Facial e Controle de Presença

**Tecnologia:** face-api.js + TensorFlow.js

**Funcionalidades:**
- Detecção de rostos em tempo real via webcam.
- Reconhecimento de alunos cadastrados (precisão >95%).
- Registro automático de presença (entrada/saída).
- Prevenção de duplicatas (mesmo aluno no mesmo dia).
- Captura e armazenamento de fotos em base64.

**Fluxo:**
1. Professor ativa câmera na sala
   ↓
2. Sistema detecta rostos continuamente
   ↓
3. Compara com banco de dados de alunos
   ↓
4. Registra presença automaticamente

### 2. 🎯 Portaria e Retirada por Geolocalização
**O fim das filas duplas e da aglomeração no portão.**

- **Monitoramento de Proximidade:** O Web App (PWA) do responsável monitora a distância em relação à escola.
- **Check-in Automático:** Ao entrar no raio de **500 metros**, o botão "Estou no Portão" é liberado.
- **Painel do Inspetor:** Um dashboard exclusivo para os porteiros que lista os alunos em ordem de chegada dos pais.
- **Fluxo de Status:** O inspetor gerencia a fila entre 'Aguardando', 'Chamando' e 'Finalizado', registrando o log exato da entrega do aluno.
- **Cadastro de Inspetores:** A escola pode criar usuários com perfil restrito apenas para gestão de saída.

### 3. 😊 Análise de Emoções em Tempo Real

**Tecnologia:** face-api.js Emotion Recognition Model

**Emoções Detectadas:**
- 😊 Feliz (Happy)
- 😢 Triste (Sad)
- 😠 Raiva (Angry)
- 😨 Medo (Fearful)
- 😲 Surpreso (Surprised)
- 🤢 Nojo (Disgusted)
- 😐 Neutro (Neutral)

**Aplicações:**
- Monitoramento de engajamento em aula
- Identificação de alunos com dificuldades
- Métricas de satisfação por turma
- Alertas para professores

### 4. 👥 Gestão Multi-tenant e Níveis de Acesso

**Arquitetura:**
- Banco de dados separado por escola
- Isolamento completo de dados
- Autenticação por escola

**Níveis de Acesso:**
1. **Super Admin** - Gestão global da plataforma.
2. **School Admin** - Gestão da escola e configurações de portaria.
3. **Teacher** - Gestão de turmas e chamadas presenciais.
4. **Inspector** - Fila de retirada e liberação de alunos no portão.
5. **Technician** - Instalação e manutenção de câmeras.
6. **Representative** - Vendas e comissões.

### 5. 📹 Sistema de Câmeras Dual

**O EduFocus utiliza DOIS tipos de câmeras:**

#### 📸 Câmera de Presença (Reconhecimento Facial)
- **Função:** Registrar entrada/saída de alunos
- **Instalação:** Técnico vincula à sala/turma
- **Acesso:** Professor da turma pode ativar
- **Tecnologia:** Face-API.js + TensorFlow.js
- **Ações:**
  - Reconhece alunos cadastrados
  - Registra presença automaticamente
  - Previne duplicatas (mesmo dia)

#### 🎥 Câmera de Monitoramento (Análise de Emoções)
- **Função:** Monitorar clima emocional da escola
- **Instalação:** Técnico vincula à escola (não a salas)
- **Acesso:** Apenas School Admin e Super Admin
- **Tecnologia:** Face-API.js Emotion Recognition
- **Ações:**
  - Analisa 7 emoções em tempo real
  - Gera relatórios agregados
  - Alertas de comportamento
  - Dados anônimos (LGPD compliant)

**Importante:** Professores NÃO têm acesso a câmeras de monitoramento, apenas às câmeras de presença de suas turmas.

**Documentação:** Ver [docs/SISTEMA_CAMERAS.md](docs/SISTEMA_CAMERAS.md)

### 7. 🕐 Ponto Biométrico para Funcionários

**Tecnologia:** face-api.js + Reconhecimento Facial

**Funcionalidades:**
- Cadastro de funcionários com foto e detecção facial
- Registro de ponto biométrico via reconhecimento facial
- **Apenas 1 registro por dia** por funcionário (entrada pela manhã)
- Calendário mensal de frequência
- Relatórios exportáveis em CSV
- **SEM notificação** (diferente do sistema de alunos)

**Componentes:**

#### 👥 Gestão de Funcionários
- Cadastro com nome, cargo, email, telefone
- Upload de foto com detecção facial automática
- Lista visual em cards
- Exclusão de funcionários

#### 🕐 Registro de Ponto
- Câmera de reconhecimento facial
- Registro automático ao reconhecer funcionário
- Prevenção de registros duplicados no mesmo dia
- Estatísticas em tempo real (presentes, ausentes, total)
- Lista de registros do dia com horários

#### 📅 Calendário de Frequência
- Visualização mensal estilo calendário
- Verde = Presente | Vermelho = Ausente
- Filtro por funcionário específico
- Navegação entre meses
- Exportação de relatórios

**Diferenças do Sistema de Alunos:**
- ✅ Apenas 1 registro por dia (não separa entrada/saída)
- ✅ Não envia notificações
- ✅ Foco em controle de ponto trabalhista
- ✅ Calendário de frequência mensal

**Arquivos:**
- `client/src/components/EmployeeManagement.jsx`
- `client/src/components/EmployeeAttendancePanel.jsx`
- `client/src/components/EmployeeAttendanceReport.jsx`
- `server/migrate_employees.js`

**Endpoints API:**
- `GET /api/school/employees` - Listar funcionários
- `POST /api/school/employees` - Cadastrar funcionário
- `DELETE /api/school/employees/:id` - Excluir funcionário
- `POST /api/school/employee-attendance` - Registrar ponto
- `GET /api/school/employee-attendance` - Buscar registros

**Banco de Dados:**
- Tabela `employees` - Dados dos funcionários
- Tabela `employee_attendance` - Registros de ponto

**Documentação:** Ver [SISTEMA_PONTO_FUNCIONARIOS.md](SISTEMA_PONTO_FUNCIONARIOS.md)

### 8. 📊 Dashboards Analíticos

**Métricas Disponíveis:**
- Taxa de presença por turma/aluno
- Distribuição de emoções
- Engajamento médio
- Histórico de presenças
- Relatórios exportáveis

---

## 📜 Regras de Negócio

### RN001 - Autenticação e Autorização

**Regra:** Todos os endpoints (exceto login) requerem autenticação via JWT.

**Implementação:**
- Token JWT com expiração de 24h
- Middleware `authenticateToken` em todas as rotas protegidas
- Verificação de role (super_admin, school_admin, teacher, etc.)

**Validações:**
- Token válido e não expirado
- Usuário existe no banco de dados
- Role adequada para a operação

### RN002 - Isolamento Multi-tenant

**Regra:** Cada escola possui banco de dados isolado. Dados de uma escola não podem ser acessados por outra.

**Implementação:**
- Banco de dados separado: `school_{id}.db`
- Função `getSchoolDB(schoolId)` para acesso
- Validação de schoolId em todas as operações

**Validações:**
- School ID válido
- Usuário pertence à escola
- Operações limitadas ao escopo da escola

### RN003 - Reconhecimento Facial

**Regra:** Um aluno só pode ter presença registrada uma vez por dia (entrada e saída separadas).

**Implementação:**
- Verificação de registro existente antes de inserir
- Tipos de presença: 'entry' (entrada) e 'exit' (saída)
- Timestamp único por registro

**Validações:**
- Aluno cadastrado no sistema
- Foto cadastrada (base64)
- Não existe registro de entrada no mesmo dia
- Similaridade facial > 0.6 (60%)

### RN005 - Gestão de Turmas

**Regra:** Uma turma pertence a uma escola e pode ter múltiplos professores e alunos.

**Implementação:**
- Tabela `classes` com `school_id`
- Relação N:N entre professores e turmas
- Relação 1:N entre turmas e alunos

**Validações:**
- Nome da turma único por escola
- Pelo menos um professor vinculado
- Turma ativa para registro de presença

### RN006 - Câmeras e Salas

**Regra:** Uma câmera está vinculada a uma sala e turma. Apenas o professor da turma pode ativar a câmera.

**Implementação:**
- Tabela `cameras` com `class_id`
- Verificação de professor antes de ativar
- Status: 'active', 'inactive', 'pending_install', 'pending_removal'

**Validações:**
- Câmera existe e está ativa
- Professor está vinculado à turma
- Turma está ativa

### RN007 - Análise de Emoções

**Regra:** Emoções são detectadas continuamente durante a aula e armazenadas para análise posterior.

**Implementação:**
- Detecção a cada frame da câmera
- Armazenamento opcional (não obrigatório)
- Cálculo de média por sessão

**Validações:**
- Face detectada com confiança > 0.5
- Emoção com maior probabilidade selecionada
- Timestamp de detecção

### RN008 - Tickets de Suporte

**Regra:** Escolas podem abrir tickets de suporte. Super Admin pode responder e fechar tickets.

**Implementação:**
- Tabela `tickets` com status
- Status: 'open', 'in_progress', 'resolved', 'closed'
- Histórico de mensagens

**Validações:**
- Escola autenticada
- Assunto e descrição obrigatórios
- Apenas Super Admin pode alterar status

### RN009 - Comissionamento

**Regra:** Representantes recebem comissão por escolas vinculadas com base em taxa configurável.

**Implementação:**
- Tabela `representatives` com `commission_rate`
- Relação N:N entre representantes e escolas
- Cálculo automático de comissões

**Validações:**
- Taxa de comissão entre 0% e 100%
- Escola ativa para gerar comissão
- Representante ativo

### RN010 - Instalação de Câmeras

**Regra:** Instalação de câmera requer aprovação do Super Admin. Remoção também requer aprovação.

**Implementação:**
- Solicitações de instalação/remoção
- Workflow de aprovação
- Notificação ao técnico após aprovação

**Validações:**
- Técnico autenticado
- Escola e sala válidas
- Aprovação do Super Admin

---

## 🚀 Instalação e Configuração (Backend Python)

### Pré-requisitos
```bash
Python >= 3.9
Node.js >= 18.x
```

### Instalação
```bash
# Clone o repositório
git clone https://github.com/leopalmeira/edufocus1.git
cd edufocus1

# Instale dependências do servidor Python
cd server_python
pip install -r requirements.txt

# Instale dependências do frontend
cd ../client
npm install
```

### Execução
```bash
# Servidor Python
python app.py

# Frontend React
npm run dev
```

---

## 📁 Estrutura do Projeto

```
edufocus1/
├── client/                      # Frontend React (Vite)
│   ├── public/
│   │   ├── models/             # Modelos TensorFlow.js
│   │   │   ├── face_recognition_model/
│   │   │   ├── face_expression_model/
│   │   │   └── ssd_mobilenetv1_model/
│   │   └── manifest.json       # PWA manifest
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   │   ├── FacialRecognitionCamera.jsx
│   │   │   ├── AttendancePanel.jsx
│   │   │   └── ...
│   │   ├── pages/             # Páginas principais
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   ├── SchoolDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── ...
│   │   ├── context/           # Context API
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx            # Componente raiz
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server_python/               # Backend Flask + SQLite
│   ├── databases/             # Bancos SQLite
│   │   ├── system.db
│   │   └── school_*.db
│   ├── app.py                 # Servidor principal Flask
│   ├── seed.py                # Dados iniciais
│   └── requirements.txt
│
├── guardian-web-pwa/            # App do Responsável (PWA)
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── docs/                       # Documentação
│   ├── INSTALACAO.md
│   ├── API.md
│   ├── SISTEMA_CAMERAS.md
│   ├── SISTEMA_PONTO_FUNCIONARIOS.md
│   └── DOC_PORTARIA_GEO.md     # Documentação do Novo Sistema de Portaria
│
└── README.md
```

---

## 🔄 Fluxos do Sistema

### Fluxo 1: Registro de Presença

```
1. Professor ativa câmera na sala
   ↓
2. Sistema detecta rosto do aluno
   ↓
3. Reconhecimento facial (face-api.js)
   ↓
4. Verifica se aluno já registrou presença hoje
   ↓
5. Registra presença no banco de dados
```

### Fluxo 2: Retirada de Alunos por Geolocalização

```
1. Responsável abre PWA no celular
   ↓
2. PWA detecta geolocalização do responsável
   ↓
3. Se próximo à escola, botão "Estou Aqui" é ativado
   ↓
4. Responsável clica em "Estou Aqui"
   ↓
5. Notificação enviada ao painel do Inspetor
   ↓
6. Inspetor visualiza solicitação e libera aluno
```

### Fluxo 3: Análise de Emoções

```
1. Câmera ativa detecta rostos
   ↓
2. Para cada rosto detectado:
   - Extrai features faciais
   - Classifica emoção (7 categorias)
   - Calcula probabilidades
   ↓
3. Exibe emoção predominante em tempo real
   ↓
4. Armazena dados para dashboard
   ↓
5. Gera métricas de engajamento
```

---

## 🔌 API e Endpoints

### Autenticação

```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "senha123"
}

Response: {
  "token": "jwt_token",
  "user": { ... }
}
```

### Presença

```http
POST /api/attendance/arrival
Authorization: Bearer {token}
Content-Type: application/json

{
  "student_id": 1
}

Response: {
  "success": true,
  "message": "Presença registrada"
}
```

### Portaria (Geolocalização)

```http
POST /api/portaria/notify-arrival
Authorization: Bearer {token}
Content-Type: application/json

{
  "guardian_id": 1,
  "school_id": 1,
  "latitude": -23.5505,
  "longitude": -46.6333
}

Response: {
  "success": true,
  "message": "Notificação de chegada enviada para a portaria."
}
```

```http
GET /api/portaria/queue
Authorization: Bearer {token}

Response: [
  {
    "guardian_name": "Maria Silva",
    "student_name": "Pedro Silva",
    "status": "Aguardando",
    "timestamp": "2023-10-27T10:00:00Z"
  }
]
```

### Alunos

```http
GET /api/school/students
Authorization: Bearer {token}

Response: [
  {
    "id": 1,
    "name": "João Silva",
    "class_id": 1,
    "class_name": "5º Ano A",
    "phone": "11987654321",
    "photo_url": "data:image/png;base64,..."
  }
]
```

**Documentação completa:** [docs/API.md](docs/API.md)

---

## 🔒 Segurança

### Autenticação

- **JWT (JSON Web Tokens)** com expiração de 24h
- **bcrypt** para hash de senhas (salt rounds: 10)
- **Middleware de autenticação** em todas as rotas protegidas

### Autorização

- **Role-based Access Control (RBAC)**
- Verificação de permissões por endpoint
- Isolamento de dados por escola (multi-tenant)

### Proteção de Dados

- **Senhas hasheadas** - Nunca armazenadas em texto plano
- **Tokens JWT** - Stateless e seguros
- **Isolamento de banco** - Cada escola tem seu próprio DB
- **Validação de entrada** - Sanitização de dados

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- **ESLint** para JavaScript
- **Prettier** para formatação
- **Comentários** em português
- **Commits semânticos** (feat, fix, docs, etc.)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Leandro Palmeira**

- GitHub: [@leopalmeira](https://github.com/leopalmeira)
- LinkedIn: [Leonardo Palmeira](https://linkedin.com/in/leopalmeira)
- Email: leopalmeira@example.com

---

## 📞 Suporte

Para suporte, abra uma [issue](https://github.com/leopalmeira/edufocus1/issues) ou entre em contato via email: leandro2703palmeira@gmail.com

---

**Desenvolvido  por Leandro Palmeira**
