
# 🏥 Clínica Social - Sistema de Gestão da Clínica Cuidar

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-green)
![Frontend](https://img.shields.io/badge/Frontend-React-blue)

> **Sistema completo para gestão de pacientes, voluntários e prontuários médicos, com foco rigoroso em Governança de Dados (LGPD) e Segurança.**

## 🎯 Sobre o Projeto

Este projeto foi desenvolvido para atender às necessidades de uma **Clínica Social**, permitindo o cadastro seguro de pacientes, gestão de voluntários (médicos, psicólogos, etc.), agendamento de consultas e manutenção de prontuários eletrônicos.

O grande diferencial deste sistema é sua **Arquitetura Orientada à Segurança e Governança**, garantindo conformidade com a LGPD através de criptografia de dados sensíveis, relatórios de impacto (DPIA) e trilhas de auditoria completas.

---

## ✨ Principais Funcionalidades

### 👥 Gestão de Pessoas
- **Pacientes:** Cadastro completo com histórico de atendimentos.
- **Voluntários:** Gestão de médicos e especialistas com controle de horários.
- **Anonimização:** Ferramenta para anonimizar dados de pacientes inativos (Direito ao Esquecimento - LGPD).

### 📝 Prontuário Eletrônico
- **Histórico Clínico:** Registro detalhado de cada consulta.
- **Evolução do Paciente:** Acompanhamento visual do progresso.
- **Receituário:** Geração de receitas médicas em PDF.

### 🛡️ Segurança e Compliance (LGPD)
- **Criptografia em Repouso:** Dados sensíveis (CPF, Endereço) são criptografados no banco de dados.
- **Logs de Auditoria:** Rastreabilidade total de quem acessou ou modificou registros.
- **Termo de Consentimento:** Geração e controle de assinatura de termos de uso de dados.
- **Relatório de Impacto (DPIA):** Documentação automática de riscos e medidas de proteção.

### 📊 Relatórios e Administrativo
- **Dashboards:** Visão geral de atendimentos e estatísticas.
- **Backup Seguro:** Ferramenta integrada para backup criptografado dos dados.
- **Configurações da Clínica:** Personalização de logo, nome e rodapé do sistema.

---

## 🛠️ Tecnologias Utilizadas

### Backend (API)
- **Linguagem:** Python 3.12+
- **Framework:** FastAPI (Alta performance e validação automática)
- **Banco de Dados:** SQLModel (SQLAlchemy + Pydantic)
- **Segurança:** Fernet (Criptografia Simétrica), JWT (Autenticação), SlowAPI (Rate Limiting)
- **Testes:** Pytest

### Frontend (Interface)
- **Framework:** React 19 (Vite)
- **Linguagem:** TypeScript
- **Estilização:** CSS Modules / TailwindCSS (Conceitos)
- **Bibliotecas:** React Router, Lucide Icons, JS-PDF

### Infraestrutura e DevOps
- **Container:** Docker & Docker Compose
- **CI/CD:** GitHub Actions (Pipeline automatizado de testes e linting)
- **Deploy:** Configurado para Railway (PaaS)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Python 3.12+
- Node.js 18+
- Git

### 1. Backend (API)
```bash
# Clone o repositório
git clone https://github.com/vitortmoraes/clinica-social.git
cd clinica-social/clinica_api

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt

# Inicie o servidor
uvicorn app.main:app --reload
```
*Acesse a documentação da API em: `http://localhost:8000/docs`*

### 2. Frontend (Interface)
```bash
# Em outro terminal, entre na pasta do frontend
cd clinica-social/clinica_social

# Instale as dependências
npm install

# Inicie o projeto
npm run dev
```
*Acesse o sistema em: `http://localhost:5173`*

---

## 🤝 Governança de Software

Este projeto segue pilares rigorosos de qualidade:
1.  **Code Quality:** Uso de `pre-commit` hooks, Black (formatador) e Flake8 (linter).
2.  **API Governance:** Contratos bem definidos via OpenAPI 3.0.
3.  **Data Governance:** Dicionário de Dados documentado e migrações rastreáveis.
4.  **Process Governance:** Esteira de CI/CD para garantir que apenas código testado chegue à produção.

---

## 👨‍💻 Autor
- **Vitor Moraes**  
  <img src="https://i.pinimg.com/1200x/1e/2a/03/1e2a033d11daf6346c6ce1df6f8b2dbb.jpg" alt="Foto de Vitor" width="150" height="150">

- **LinkedIn**: [https://www.linkedin.com/in/vitor-moraes-2801ba340/](https://www.linkedin.com/in/vitor-moraes-2801ba340/)
- **E-mail**: [vitor.tm@gmail.com](mailto:vitor.tm@gmail.com)
- **Youtube**: [youtube.com/@vitortmoraes](https://www.youtube.com/@vitortmoraes)

## 💡 Agradecimentos

Agradeço ao Rodolfo Peixoto por toda orientação e ajuda com a criação do Sistema de Gestão da Clínica Cuidar com o objetivo de aprendizado da Programação e também da utilização do Google Antigravity.

---
*Este projeto é Open Source e está sob a licença [MIT](LICENSE).*
