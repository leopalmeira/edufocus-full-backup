# Guia White Label - EduFocus Guardian

Este sistema permite gerar versões personalizadas do App do Responsável para diferentes escolas (tenants) de forma automatizada.

## Como criar um novo App de Escola

1.  **Crie a pasta da escola:**
    Vá em `tenants/` e crie uma nova pasta com o slug da escola (ex: `colegio-objetivo`).
    
2.  **Adicione o arquivo `branding.json`:**
    Copie de `tenants/euclides/branding.json` e altere as cores, nomes e URLs.

3.  **Adicione os ativos (Opcional):**
    Coloque arquivos `logo.png` e `icon.png` dentro da pasta da escola para que o script os utilize.

4.  **Execute o configurador:**
    No terminal, dentro da pasta `guardian-web-pwa`, rode:
    ```bash
    node scripts/build-tenant.cjs colegio-objetivo
    ```

5.  **Gere o Build:**
    ```bash
    npm run build
    ```

## Estrutura de Arquivos

- `tenants/`: Contém as identidades visuais de cada cliente.
- `scripts/build-tenant.cjs`: Script que injeta a identidade visual no código-fonte.
- `public/manifest.json`: É atualizado automaticamente pelo script.
- `index.html`: As cores são controladas por variáveis CSS (`--primary`, etc) definidas no `:root` e alteradas via classe dinâmica.

## Publicação nas Lojas

Após rodar o build, você terá uma pasta `dist/`.
1.  Suba o conteúdo da `dist/` para um servidor (ex: Firebase Hosting, Netlify, ou seu servidor próprio).
2.  Acesse o [PWABuilder](https://www.pwabuilder.com/).
3.  Insira a URL do PWA.
4.  Gere o pacote para **Google Play (Android)** e **Apple App Store (iOS)**.

O app gerado terá o nome, ícone e cores da escola configurada.
