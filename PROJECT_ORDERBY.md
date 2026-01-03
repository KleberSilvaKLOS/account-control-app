my-finance-app/
├── assets/                  # Arquivos estáticos globais
│   ├── fonts/               # Fontes customizadas
│   ├── icons/               # Ícones de categorias (Uber, Mercado, etc)
│   └── images/              # Logos e backgrounds da interface
├── src/                     # Código fonte da aplicação
│   ├── @types/              # Definições de tipos TypeScript 
│   ├── components/          # Componentes reutilizáveis (Botões, Cards de Gastos)
│   ├── database/            # Configurações de banco de dados e Migrations [cite: 23, 40]
│   ├── hooks/               # Custom hooks para lógica de estado
│   ├── routes/              # Configuração de navegação (Tab e Stack Navigation)
│   ├── screens/             # Telas principais do aplicativo
│   │   ├── Summary/         # Tela de Resumo Geral
│   │   ├── Expenses/        # Tela de Lançamento de Gastos
│   │   ├── FixedBills/      # Tela de Contas Fixas
│   │   └── Investments/     # Tela de Investimentos
│   ├── services/            # Integração com APIs e serviços externos [cite: 23]
│   ├── utils/               # Funções utilitárias (Formatação de moeda, data)
│   └── App.tsx              # Ponto de entrada da aplicação React Native [cite: 35]
├── .env                     # Variáveis de ambiente (Chaves de API, DB URL)
├── .gitignore               # Arquivos ignorados pelo Git 
├── docker-compose.yml       # Orquestração para instâncias de PostgreSQL/Nginx 
├── package.json             # Dependências e scripts do projeto [cite: 35]
├── README.md                # Documentação do projeto
└── tsconfig.json            # Configurações do TypeScript [cite: 39]