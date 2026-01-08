# 🎯 Sistema de Portaria e Retirada por Geolocalização

O EduFocus agora conta com um sistema inteligente de portaria que utiliza a geolocalização dos responsáveis para otimizar o fluxo de saída dos alunos, garantindo segurança e agilidade.

## 🚀 Como Funciona

O sistema conecta em tempo real três pontas: o **Responsável (Pai/Mãe)**, a **Escola** e o **Inspetor de Portaria**.

### 1. Monitoramento do Responsável (PWA)
*   **Geolocalização Ativa:** O Web App do responsável monitora sua posição GPS em tempo real.
*   **Cálculo de Proximidade:** O sistema calcula automaticamente a distância entre o responsável e a unidade escolar.
*   **Aviso Visual:** Quando o responsável entra em um raio de **500 metros** da escola, o botão "Estou Aqui" ganha destaque visual e alertas de proximidade.
*   **Notificação de Chegada:** Ao clicar no botão, uma notificação é enviada instantaneamente para a central da portaria da escola.

### 2. Gestão Escolar (Dashboard Admin)
*   **Configuração de Localização:** Na aba "Portaria (Geral)", o administrador da escola define as coordenadas GPS (Latitude/Longitude) da unidade.
*   **Contas de Inspetores:** A escola pode criar usuários específicos com o perfil "Inspetor", que têm acesso apenas ao painel de retiradas.

### 3. Painel do Inspetor (Monitor de Saída)
*   **Fila em Tempo Real:** O inspetor visualiza uma lista atualizada automaticamente com os alunos cujos responsáveis acabaram de chegar.
*   **Identificação Visual:** O painel exibe a foto do aluno, nome, turma e nome do responsável que está no portão.
*   **Fluxo de Chamada:**
    *   **Chamar Aluno:** O inspetor sinaliza que o aluno está sendo chamado no pátio.
    *   **Liberado:** Quando o aluno cruza o portão, o inspetor finaliza a saída, limpando a fila e registrando o horário exato da entrega.

## 🛡️ Segurança e Privacidade
*   **Vínculo Identificado:** Apenas responsáveis vinculados e autorizados podem solicitar a retirada pelo aplicativo.
*   **Isolamento de Dados:** Como todo o ecossistema EduFocus, os dados de retirada são isolados por escola.
*   **LGPD:** Não armazenamos o rastro de localização do pai, apenas calculamos a distância relativa no momento do uso para disparar o alerta.

## 🛠️ Detalhes Técnicos
*   **Frontend:** Integração com `navigator.geolocation` via Browser.
*   **Backend:** Endpoints dedicados no servidor Python para gestão de `pickup_requests`.
*   **Base de Dados:** Tabela `pickup_requests` em cada base escolar para rastreabilidade total.
