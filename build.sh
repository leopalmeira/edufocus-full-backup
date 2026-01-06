#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Instalando dependências da raiz ---"
npm install

echo "--- Instalando dependências do Servidor ---"
cd server && npm install && cd ..

echo "--- Instalando e buildando o Cliente (Painel Admin) ---"
cd client && npm install && npm run build && cd ..

echo "--- Build concluído com sucesso! ---"
