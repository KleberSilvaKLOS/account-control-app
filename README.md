# 💰 MyFinance - Controle Financeiro Pessoal

![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Badge React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Badge Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Badge TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

> Um aplicativo intuitivo e robusto para gestão completa de finanças pessoais, investimentos e contas fixas.

## 📱 Sobre o Projeto

O **MyFinance** nasceu da necessidade de ter um controle financeiro na palma da mão, sem planilhas complexas. O objetivo é oferecer uma visão clara da saúde financeira através de uma interface moderna, segura e fácil de usar.

O projeto foi desenvolvido utilizando **React Native** com **Expo**, garantindo performance nativa e compatibilidade tanto para Android quanto para iOS.

## ✨ Funcionalidades Principais

O aplicativo conta com módulos específicos para cada área da vida financeira:

- **🔐 Autenticação e Segurança**
  - Login seguro via Firebase Auth.
  - Criação de PIN para acesso rápido.
  - **Suporte a Biometria** (Digital/FaceID) via `expo-local-authentication`.

- **💸 Lançamento de Gastos Diários**
  - Registro rápido de despesas.
  - Categorização inteligente e visualização por ícones.

- **📅 Gestão de Contas Fixas**
  - Controle de recorrências (aluguel, internet, streaming).
  - Alertas visuais de vencimento.

- **📈 Dashboard de Investimentos**
  - Acompanhamento da evolução patrimonial.
  - Gráficos de pizza e barras para análise de carteira.

- **📊 Resumo Geral (Home)**
  - Visão unificada de saldo, gastos do mês e total investido.

## 🛠️ Tecnologias e Dependências

O projeto utiliza as seguintes bibliotecas principais:

- **Core:**
  - `react-native`
  - `expo`
  - `typescript`

- **Navegação:**
  - `@react-navigation/native`
  - `@react-navigation/bottom-tabs` (Menu inferior)
  - `@react-navigation/native-stack` (Navegação entre telas)

- **Backend & Dados:**
  - `firebase` (Autenticação e Firestore Database)

- **Componentes Visuais & Funcionais:**
  - `expo-local-authentication` (Biometria)
  - `@react-native-community/datetimepicker` (Seleção de datas)
  - `react-native-chart-kit` (Gráficos)
  - `expo-font` & `expo-google-fonts` (Tipografia personalizada)

## 📂 Estrutura do Projeto

A organização do código segue as melhores práticas de Clean Architecture adaptada para React Native:

```bash

src/
  ├── @types/          # Definições de tipos globais (TypeScript)
  ├── assets/          # Imagens, ícones e fontes
  ├── components/      # Componentes reutilizáveis (Botões, Cards, Inputs)
  ├── config/          # Configurações externas (ex: Firebase config)
  ├── context/         # Context API (Gerenciamento de estado global)
  ├── hooks/           # Custom Hooks (ex: useBiometrics, useAuth)
  ├── routes/          # Configuração de rotas (Stack e Tabs)
  ├── screens/         # Telas da aplicação
  │   ├── Auth/        # Login, Cadastro, Recuperação de Senha
  │   ├── Home/        # Tela principal
  │   ├── Expenses/    # Lançamento de gastos
  │   ├── FixedBills/  # Contas fixas
  │   └── Investments/ # Dashboard de investimentos
  ├── services/        # Lógica de conexão com APIs e Firebase
  ├── theme/           # Arquivos de estilo global (Cores, Fontes)
  └── utils/           # Funções auxiliares e formatadores de moeda/data

🚀 Como Rodar o Projeto
Pré-requisitos: Você precisa ter o Node.js instalado, uma conta no Expo e o app Expo Go no seu celular (ou um emulador configurado).

1. Clone este repositório
Bash

git clone [https://github.com/seu-usuario/account-control-app.git](https://github.com/seu-usuario/account-control-app.git)
cd account-control-app
2. Instale as dependências
Bash

npm install
# ou
yarn install
3. Configuração do Firebase
Crie um arquivo chamado firebase.ts dentro da pasta src/config/ e adicione as credenciais do seu projeto Firebase:

TypeScript

// src/config/firebase.ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export { app };
4. Execute o projeto
Bash

npx expo start
5. Acesse no celular
Escaneie o QR Code que aparecerá no terminal usando o app Expo Go (Android) ou o app Câmera (iOS).

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

Faça um Fork do projeto

Crie uma Branch para sua Feature (git checkout -b feature/MinhaFeature)

Faça o Commit (git commit -m 'Adicionando uma feature incrível')

Faça o Push (git push origin feature/MinhaFeature)

Abra um Pull Request

