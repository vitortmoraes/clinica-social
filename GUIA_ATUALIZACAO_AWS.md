# 🚀 Como Atualizar seu Sistema na AWS

Agora que você fez novas alterações ou correções e as enviou para o GitHub, você precisa "puxar" essas novidades para dentro do seu servidor AWS.

Aqui está o passo a passo exato do que você deve fazer sempre que precisarmos atualizar algo.

## Passo 1: Atualizar o Backend (API)
O Backend é o motor do sistema que roda no Ubuntu (servidor Linux) da AWS.

1. Acesse o seu servidor EC2 via terminal (SSH).
2. Entre na pasta da API:
   ```bash
   cd ~/clinica-social/clinica_api
   ```
3. Puxe as atualizações do GitHub:
   ```bash
   git pull
   ```
4. Reinicie o servidor Uvicorn:
   Se você roda ele abrindo e deixando a tela preta preta aberta, basta cancelá-lo (`CTRL+C`) e rodar o comando de novo.
   Se você configurou para rodar sozinho no fundo (como um serviço), rode: 
   ```bash
   sudo systemctl restart uvicorn
   ```

---

## Passo 2: Atualizar o Frontend (Telas)
O Frontend são os arquivos visuais (HTML, CSS, JS) que o AWS S3 hospeda.

1. **Na sua máquina local** (no seu VSCode), abra um terminal e puxe as novidades:
   ```bash
   git pull
   ```
2. Entre na pasta do frontend (se já não estiver nela):
   ```bash
   cd clinica_social
   ```
3. Gere os novos arquivos de build de produção:
   ```bash
   npm run build
   ```
   *(Isso criará/atualizará a pasta `dist`)*.
4. Faça o upload do conteúdo dessa nova pasta `dist` para o seu Bucket do **Amazon S3** (substituindo os antigos).

E é só isso! Você atualizou sua aplicação completa nos servidores da Amazon. 🎉
