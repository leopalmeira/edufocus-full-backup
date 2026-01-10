# 🎓 EduFocus - Ecossistema de Gestão Educacional

> **Transformando câmeras de segurança em ferramentas de gestão pedagógica e engajamento escolar.**

[![Status](https://img.shields.io/badge/status-production-success)](https://github.com/leopalmeira/edufocus1)
[![Python](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3-blue)](https://reactjs.org/)
[![Portaria](https://img.shields.io/badge/Portaria-Geolocalização-blueviolet)](./DOC_PORTARIA_GEO.md)

---

## 📖 O Que é o EduFocus na Prática?

O **EduFocus** é uma plataforma de **Gestão Avançada** que resolve três dores críticas das instituições de ensino modernas: **Segurança, Controle de Acesso e Saída Estruturada.**

O sistema age ativamente:
1.  **Segurança Ativa:** Identifica quem entra e sai da escola em milissegundos através de biometria facial.
2.  **Portaria Inteligente (GEO):** Notifica a equipe de portaria no exato momento em que o responsável entra em um raio de 500m da escola.
3.  **Pedagogia Baseada em Dados:** Analisa o engajamento e o clima das turmas em tempo real.

Tudo isso rodando em uma arquitetura **Multi-tenant robusta**, permitindo o isolamento total de dados entre diferentes unidades escolares, agora com suporte completo a **Redes de Ensino e Filiais**.

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
- **Filiais:** Gestão centralizada de múltiplas unidades.

### 👩‍🏫 Para Professores: "Foco no Ensino, Não na Chamada"
O professor entra em sala e começa a aula. A câmera faz a chamada silenciosamente.
- **Zero tempo perdido** gritando nomes.
- **Análise de Engajamento:** O sistema avisa se a turma está perdendo o interesse, permitindo ajustar a didática na hora.

---

## 🏗️ Arquitetura Técnica Profunda

O sistema foi desenhado para ser escalável, seguro e econômico.

### 1. Núcleo de Processamento de Imagem (Edge Computing)
Utilizamos tecnologia de ponta rodando diretamente no navegador (Client-side) ou em servidores de borda.
*   **Privacidade:** As imagens não precisam ser enviadas para nuvens de terceiros, o processamento é local.
*   **Custo Zero:** Não há cobrança por API de reconhecimento.
*   **Performance:** Latência mínima, feedback visual em tempo real (< 100ms).

### 2. Sistema de Portaria por Geolocalização
Integramos a Geolocation API nativa para um sistema de "Check-in" de proximidade.
*   **Distância Real:** Cálculo de Haversine entre o responsável e a unidade escolar.
*   **Real-time:** O painel do inspetor de portaria atualiza via polling/SSE para exibir quem está chegando.

### 3. Multi-tenancy Real (Isolamento Lógico e Físico)
Para garantir que dados da "Escola A" nunca vazem para a "Escola B":
*   **Bancos Isolados:** Cada escola tem seu próprio arquivo SQLite (`school_1.db`, `school_2.db`).
*   **Banco Sistema:** Um banco global (`system.db`) gerencia credenciais e metadados das escolas.

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

**Tecnologia:** Processamento Biométrico Local

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
- **Fluxo de Status:** O inspetor gerencia a fila entre 'Aguardando', 'Chamando' e 'Finalizado'.

### 3. 😊 Análise de Clima e Engajamento

**Tecnologia:** Tecnologia avançada

**Indicadores:**
- Nível de Satisfação
- Nível de Atenção
- Clima da Turma

**Aplicações:**
- Monitoramento de engajamento em aula
- Identificação de alunos com dificuldades
- Métricas de satisfação por turma
- Alertas para professores

### 4. 🏢 Novo: Gestão de Filiais e Redes de Ensino

**Um sistema completo para grupos educacionais com múltiplas unidades.**

**Funcionalidades:**
- **Vinculação Hierárquica:** Conecte escolas filiais a uma escola matriz de forma segura via Tokens únicos.
- **Troca Rápida de Contexto:** Alterne a visualização entre diferentes unidades com um clique no menu, sem precisar fazer logoff.
- **Centralização de Dados:** A matriz pode visualizar alunos, professores e turmas de todas as filiais.
- **Permissões Granulares:** 
  - Apenas a Matriz pode remover o vínculo.
  - Filiais operam seus dados normalmente mas reportam à matriz.
- **Edição de Dados da Unidade:** Gerencie nome, CNPJ, endereço e contatos de cada unidade diretamente pelo painel.

### 5. 👥 Gestão Multi-tenant e Níveis de Acesso

**Arquitetura:**
- Banco de dados separado por escola
- Isolamento completo de dados
- Autenticação por escola

**Níveis de Acesso:**
1. **Super Admin** - Gestão global da plataforma.
2. **School Admin** - Gestão da escola e configurações.
3. **Teacher** - Gestão de turmas e chamadas presenciais.
4. **Inspector** - Fila de retirada e liberação de alunos no portão.
5. **Technician** - Instalação e manutenção de câmeras.
6. **Representative** - Vendas e comissões.

### 6. 📹 Sistema de Câmeras Dual

**O EduFocus utiliza DOIS tipos de câmeras:**

#### 📸 Câmera de Presença (Biometria)
- **Função:** Registrar entrada/saída de alunos
- **Instalação:** Técnico vincula à sala/turma
- **Ações:**
  - Reconhece alunos cadastrados
  - Registra presença automaticamente

#### 🎥 Câmera de Monitoramento (Clima)
- **Função:** Monitorar clima da escola
- **Instalação:** Técnico vincula à escola
- **Ações:**
  - Analisa expressões em tempo real
  - Gera relatórios agregados
  - Dados anônimos (LGPD compliant)

**Importante:** Professores NÃO têm acesso a câmeras de monitoramento, apenas às câmeras de presença de suas turmas.

### 7. 🕐 Ponto Biométrico para Funcionários

**Tecnologia:** Biometria Facial

**Funcionalidades:**
- Cadastro de funcionários com foto.
- Registro de ponto biométrico.
- **Apenas 1 registro por dia** por funcionário (entrada pela manhã).
- Calendário mensal de frequência.
- Relatórios exportáveis em CSV.

**Componentes:**

#### 👥 Gestão de Funcionários
- Cadastro com nome, cargo, email, telefone
- Upload de foto
- Lista visual em cards

#### 🕐 Registro de Ponto
- Câmera de reconhecimento
- Registro automático ao reconhecer funcionário
- Estatísticas em tempo real

#### 📅 Calendário de Frequência
- Visualização mensal estilo calendário
- Verde = Presente | Vermelho = Ausente
- Exportação de relatórios

### 8. 📊 Dashboards Analíticos

**Métricas Disponíveis:**
- Taxa de presença por turma/aluno
- Distribuição de engajamento
- Histórico de presenças
- Relatórios exportáveis

### 9. 💬 Sistema de Comunicação Integrado v2.0

O sistema conta com um poderoso ecossistema de mensagens em tempo real integrado à plataforma.

#### 🏫 Escola ↔️ Professor
*   **Canal Direto:** Comunicação fluida entre coordenação e professores via dashboard.

#### 🏠 Escola ↔️ Responsável (App PWA)
*   **Chat Dedicado:** Pais entram em contato direto com a escola via APP.
*   **Envio de Mídia:** Suporte para fotos, áudio e arquivos.
*   **Performance:** Atualização rápida e segura.

#### 🎛️ Painel de Gestão da Comunicação
*   **Central de Mensagens:** Gestão unificada de conversas.
*   **Transmissão (Broadcast):** Mensagens em massa para turmas inteiras.

---

## 🚀 Instalação e Configuração

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

## 📜 Regras de Negócio Importantes

### RN001 - Autenticação e Autorização
Todos os endpoints (exceto login) requerem autenticação via JWT.

### RN002 - Isolamento Multi-tenant
Cada escola possui banco de dados isolado. Dados de uma escola não podem ser acessados por outra.

### RN003 - Reconhecimento Facial
Um aluno só pode ter presença registrada uma vez por dia (entrada e saída separadas).

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Leandro Palmeira**
