<div align="center">
  <img src="assets/icons/icon.png" alt="Cooler Monitor BR" width="120" height="120" />

  # COOLER MONITOR BR 🥶

  **Monitoramento profissional de hardware para Windows**

  <p>
    <img src="https://img.shields.io/badge/Electron-28-47848F?logo=electron&logoColor=white" alt="Electron" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/.NET-9-512BD4?logo=dotnet&logoColor=white" alt=".NET 9" />
    <img src="https://img.shields.io/badge/LibreHardwareMonitor-0.9.3-00B4FF" alt="LibreHardwareMonitor" />
  </p>

  <p>
    <a href="#instalação">
      <img src="https://img.shields.io/badge/Download-v1.0.0-22c55e?style=for-the-badge&logo=github" alt="Download" />
    </a>
  </p>

  <p>
    <b>Desenvolvido por <a href="https://github.com/Mascoteey">Mascoteey</a></b><br />
    <sub>Criado com assistência da <a href="https://opencode.ai">OpenCode AI</a></sub>
  </p>

  <p>
    <a href="https://github.com/Mascoteey/Cooler-Monitor-BR/releases">📦 Releases</a>
    &nbsp;·&nbsp;
    <a href="#funcionalidades">✨ Funcionalidades</a>
    &nbsp;·&nbsp;
    <a href="#capturas-de-tela">📸 Capturas</a>
    &nbsp;·&nbsp;
    <a href="#tecnologias">⚙️ Tecnologias</a>
  </p>
</div>

---

## 📋 Índice

- [Funcionalidades](#-funcionalidades)
- [Capturas de Tela](#-capturas-de-tela)
- [Instalação](#-instalação)
- [Portable](#-versão-portable)
- [Como Usar](#-como-usar)
- [Perfis de Ventoinhas](#-perfis-de-ventoinhas)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Desenvolvimento](#-desenvolvimento)
- [Licença](#-licença)

---

## ✨ Funcionalidades

### 🔧 Monitoramento em Tempo Real
- **CPU**: temperatura por núcleo, uso %, frequência, voltagem, potência (TDP)
- **GPU**: temperatura, uso %, VRAM, clock core/memória, PCIe link speed, fan/RPM
- **Memória RAM**: uso total/por slot, frequência, canal (dual/single)
- **Armazenamento**: temperatura, uso %, saúde SMART (SSD/HDD)
- **Placa-mãe**: chipset, BIOS, sensores de tensão
- **Rede**: velocidade de download/upload, uso de banda

### 🌀 Controle Inteligente de Ventoinhas
- **3 perfis predefinidos**: Silencioso · Balanceado · Performance
- **Modo Customizado**: arraste os pontos no gráfico curva PWM × Temperatura
- **Override Manual**: controle deslizante de PWM para cada cooler
- **Seleção de fonte de temperatura**: CPU / GPU / Placa-mãe por cooler
- **Indicador visual**: RPM alvo × RPM real em tempo real

### 📊 Gráficos e Histórico
- Gráficos em tempo real com atualização a cada segundo
- Histórico de sensores armazenado em SQLite
- Sparklines nos cards de visão geral

### 🔔 Sistema de Alertas
- Limites configuráveis por sensor
- Notificações quando temperaturas ou uso excedem o limite

### 🖥️ Interface
- Tema cyberpunk escuro com gradientes neon
- Animações suaves (Framer Motion)
- Painel de debug (Ctrl+Shift+D) com testes automatizados
- Responsivo (adaptável a diferentes resoluções)

### ⚡ Extra
- Ícone na bandeja do sistema
- Bridge C# independente com LibreHardwareMonitor
- Fecha completamente todos os processos ao sair
- Versão portable disponível (sem instalação)

---

## 📸 Capturas de Tela

<div align="center">
  <table>
    <tr>
      <td><b>Dashboard</b></td>
      <td><b>CPU</b></td>
      <td><b>GPU</b></td>
    </tr>
    <tr>
      <td>Visão geral com todos os sensores</td>
      <td>Temperatura por núcleo, frequência, voltagem</td>
      <td>Clock, VRAM, temperatura, fan</td>
    </tr>
    <tr>
      <td><b>Fans</b></td>
      <td><b>Histórico</b></td>
      <td><b>Configurações</b></td>
    </tr>
    <tr>
      <td>Curva PWM, perfis, override manual</td>
      <td>Gráficos históricos em SQLite</td>
      <td>Alertas, inicialização, temas</td>
    </tr>
  </table>
</div>

---

## 📦 Instalação

### Instalador NSIS
1. Baixe o instalador em [Releases](https://github.com/Mascoteey/Cooler-Monitor-BR/releases)
2. Execute `COOLER MONITOR BR Setup 1.0.0.exe`
3. Siga os passos do instalador
4. O programa estará no Menu Iniciar e na Área de Trabalho

### 🧳 Versão Portable
1. Baixe `COOLER MONITOR BR Portable 1.0.0.exe`
2. Copie para qualquer pasta ou pendrive
3. Execute direto — **sem instalação necessária**

### Requisitos
- Windows 10/11 (64-bit)
- .NET 9 Runtime (instalado automaticamente com Windows Update ou manualmente em [dotnet.microsoft.com](https://dotnet.microsoft.com/en-us/download/dotnet/9.0))

---

## 🎮 Como Usar

| Ação | Descrição |
|------|-----------|
| **Abrir** | Execute o programa, ícone aparece na bandeja do sistema |
| **Navegar** | Sidebar com 13 páginas de monitoramento |
| **Selecionar perfil** | FansPage → botão do perfil → Silencioso/Balanceado/Performance |
| **Customizar curva** | Expanda um cooler → arraste os pontos no gráfico |
| **Override manual** | Ative o slider PWM no cooler expandido |
| **Debug** | Ctrl+Shift+D → painel com testes, logs, store |
| **Fechar** | Clique no X ou saia pelo menu da bandeja |

---

## 🌀 Perfis de Ventoinhas

| Perfil | Descrição | Cor |
|--------|-----------|-----|
| **Silencioso** | RPM baixo, prioriza silêncio (10-90%) | 🟢 Verde |
| **Balanceado** | Equilíbrio ruído/desempenho (15-100%) | 🟡 Amarelo |
| **Performance** | Máxima refrigeração (30-100%) | 🔴 Vermelho |
| **Customizado** | Curva definida pelo usuário | 🔵 Azul |

Cada cooler tem 7 pontos de ancoragem ajustáveis no gráfico Temperatura × PWM.

---

## ⚙️ Tecnologias

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| Electron | 28 | Desktop framework |
| React | 18 | UI Library |
| TypeScript | 5 | Tipagem estática |
| Vite | 5 | Bundler |
| TailwindCSS | 3 | Estilização |
| Framer Motion | 11 | Animações |
| Recharts | 2 | Gráficos |
| Zustand | 4 | Gerenciamento de estado |
| React Query | 5 | Cache e fetching |

### Backend & Bridge
| Tecnologia | Versão | Função |
|------------|--------|--------|
| .NET | 9 | Bridge C# de hardware |
| LibreHardwareMonitorLib | 0.9.3 | Leitura de sensores |
| Prisma ORM | 5 | Database ORM |
| SQLite | 3 | Banco de dados local |
| Express | 4 | API HTTP |
| WebSocket | 8 | Tempo real |

### Ferramentas
| Tecnologia | Função |
|------------|--------|
| electron-builder | Empacotamento e distribuição |
| NSIS | Instalador Windows |
| ESLint | Linter |
| Prettier | Formatador |

---

## 📁 Estrutura do Projeto

```
cooler-monitor-br/
├── apps/
│   ├── desktop/                    # Aplicação Electron
│   │   ├── src/
│   │   │   ├── main/               # Processo principal (Electron)
│   │   │   │   ├── main.ts         # IPC, tray, bridge, janela
│   │   │   │   ├── preload.ts      # Ponte segura renderer ↔ main
│   │   │   │   └── normalizeData.ts # Conversor bridge JSON → frontend
│   │   │   └── renderer/           # Processo renderizador (React)
│   │   │       ├── pages/          # 13 páginas
│   │   │       ├── components/     # Layout, charts, ui, debug
│   │   │       ├── hooks/          # useHardwareData
│   │   │       ├── store/          # Zustand stores
│   │   │       ├── utils/          # formatadores, testes
│   │   │       └── styles/         # global.css
│   │   ├── electron-builder.json5  # Config de build
│   │   └── vite.config.ts
│   └── backend/                    # API Express + Prisma + SQLite
├── hardware-bridge/
│   └── CoolerHardwareBridge/       # Bridge C# (.NET 9)
│       └── Program.cs              # Leitura LibreHardwareMonitor
├── packages/
│   ├── shared/                     # Tipos compartilhados
│   ├── core/                       # Lógica central
│   ├── hardware/                   # Abstração de hardware
│   ├── database/                   # Abstração de banco
│   ├── ui/                         # Componentes compartilhados
│   └── utils/                      # Utilitários
├── release/                        # Builds gerados
└── assets/                         # Ícones
```

---

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 20+
- .NET 9 SDK
- Git

### Setup
```bash
# Clone o repositório
git clone https://github.com/Mascoteey/Cooler-Monitor-BR.git
cd cooler-monitor-br

# Instale as dependências
npm install

# Compile a bridge C#
dotnet publish hardware-bridge/CoolerHardwareBridge/ -c Release -r win-x64 --self-contained true

# Desenvolvimento (com hot reload)
cd apps/desktop
npm run dev

# Build completo
npm run build

# Gerar instalador + portable
npm run dist
```

### Scripts principais
| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server com hot reload |
| `npm run build` | Build de produção |
| `npm run dist` | Gera instalador NSIS + portable |
| `npm run lint` | Lint |
| `npm run typecheck` | Verificação de tipos |

---

## 📄 Licença

Distribuído sob licença **MIT**. Veja [LICENSE](LICENSE.txt) para mais informações.

---

<div align="center">
  <p>
    <sub>Desenvolvido com ❤️ no Brasil por <a href="https://github.com/Mascoteey">Mascoteey</a></sub>
    <br />
    <sub>Criado com assistência da <a href="https://opencode.ai">OpenCode AI</a></sub>
  </p>
  <p>
    <a href="https://github.com/Mascoteey/Cooler-Monitor-BR/issues">Reportar Bug</a>
    &nbsp;·&nbsp;
    <a href="https://github.com/Mascoteey/Cooler-Monitor-BR/discussions">Discussões</a>
    &nbsp;·&nbsp;
    <a href="https://github.com/Mascoteey/Cooler-Monitor-BR/releases">Downloads</a>
  </p>
</div>
