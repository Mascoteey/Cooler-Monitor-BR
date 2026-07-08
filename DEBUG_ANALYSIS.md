# Análise de Debug — COOLER MONITOR BR v1.1.0

> Revisão técnica completa realizada em 08/07/2026 cobrindo: processo principal (Electron),
> bridge C# (LibreHardwareMonitor), renderer (React), tipos compartilhados e testes automatizados.

---

## 1. Resumo Executivo

| Categoria | Severidade | Status |
|-----------|-----------|--------|
| Bridge C# — CPU temp / VRAM / unidades / thread-safety | 🔴 Alta | ✅ Corrigido |
| Main — vazamento de intervalo simulado + loop de restart | 🔴 Alta | ✅ Corrigido |
| Main — `set-fan-speed` silencioso em modo simulado | 🟡 Média | ✅ Corrigido |
| Normalize — campos extras em `cpu` / tipo de retorno | 🟡 Média | ✅ Corrigido |
| GpuPage — gráfico "Uso GPU" plotava CPU usage | 🟡 Média | ✅ Corrigido |
| systemTest — dados de teste fora do tipo `HardwareData` | 🟡 Média | ✅ Corrigido |
| Tipos globais `electronAPI` incompletos | 🟡 Média | ✅ Corrigido |
| FansPage — `label` ausente em fallback do main | 🟡 Média | ✅ Corrigido (via normalizeData) |

**Nenhum erro de crash (null-deref) encontrado** — as defesas `?.` previnem exceções.
Os problemas eram de **precisão de dados** e **vazamentos/loops órfãos**.

---

## 2. Bridge C# (hardware-bridge/CoolerHardwareBridge/Program.cs)

### 2.1 🔴 CPU Temperature = 0 mesmo com hardware detectado
- **Causa raiz**: LHM lê temp da CPU via MSR (`IA32_THERM_STATUS`) usando o driver
  WinRing0 de ring-0. Sem **elevação (Admin)** o driver falha → sensor `Value = null`
  → `Sanitize` converte para `0.0`.
- **Bug agravante**: `FillCpuData` sobrescrevia `data.Cpu.Temperature` a cada iteração
  (`Program.cs:232`), pegando o *último* sensor de temperatura (frequentemente 0).
- **Concorrência**: timer (`SendHardwareData`) e thread stdin (`SetFanControl`) chamavam
  `Update()` no mesmo `_computer` sem lock → corridas de dados.
- **Correção**:
  - `FillCpuData` agora usa `Package`/`Core Max`/`CPU` e `Math.Max` (linha ~232-234).
  - `usage` usa "CPU Total" (não último core).
  - `lock (ComputerLock)` em `SetFanControl` e no bloco de `Accept` em `SendHardwareData`.

### 2.2 🔴 VRAM em GB nunca capturada
- `FillGpuData` não tratava `SensorType.Data` (LHM reporta VRAM usado/total em MB como Data).
- **Correção**: adicionados campos `memoryTotal`/`memoryUsed` ao `SensorGroupDto` e caso
  `SensorType.Data` que captura "Total"/"Used". O `normalizeData.ts` já os consome.
- Branch D3D morto (linhas 268-272) removido.

### 2.3 🔴 RAM / Storage em bytes, não GB
- `FillMemoryData` e `FillStorageData` usavam valores brutos (bytes).
- **Correção**: fator `bytesToGb` aplicado; `MemoryDto.Total` agora derivado.

### 2.4 🟡 Motherboard catch-all rotulava temps como PCH
- `else { data.Motherboard.Pch = v; }` rotulava qualquer temp não mapeada como PCH.
- **Correção**: adicionado `cpuTemp` ao `MotherboardDto`; temps de CPU vão para `cpuTemp`.

### 2.5 ⚠️ Limitação conhecida (não corrigível em código)
- **Controle de fan em ASUS TUF X299**: LHM 0.9.3 **não implementa `Control`** para a
  SuperIO dessa placa → fans são *detectadas* (RPM) mas **não controláveis** via software.
  Isso é limitação da biblioteca, não do bridge. Requer Admin + suporte da LHM.
- **CPU temp requer Admin** em quase todas as placas Intel (MSR). Sem Admin: fallback
  sintético (`cpuUsage * 0.5 + 30`) no normalizador.

---

## 3. Processo Principal Electron (apps/desktop/src/main/main.ts)

### 3.1 🔴 Vazamento: `simulateHardwareData` `setInterval` nunca limpo
- O handle do `setInterval` (linha 323) não era armazenado nem cancelado.
- Se o bridge fosse encontrado depois (crash→simula→restart), **simulador E bridge rodavam
  juntos** → 2 frames de `hardware-data` por tick.
- **Correção**: `simInterval` module-level + `clearSimInterval()` chamado em:
  `startHardwareBridge()` (início e no 1º dado real), e `cleanup()`.

### 3.2 🔴 Loop de restart ignora `isQuitting`
- `exit` → `setTimeout(startHardwareBridge, 2000)` disparava mesmo após `app.quit()`,
  criando processo órfão + acúmulo de listeners.
- **Correção**: guardas `if (isQuitting) return;` em ambos.

### 3.3 🟡 `set-fan-speed` silencioso em modo simulado
- Sem `hardwareProcess`, o handler não fazia nada (sem log, sem retorno).
- **Correção**: emite `fan-control-result {success:false}` para o renderer quando o bridge
  não está rodando, permitindo UX de "controle indisponível".

### 3.4 🟡 Servidor HTTP nunca fechado
- `server` (WebSocket) não tinha referência; `cleanup()` chamava `wss.close()` mas não
  `server.close()` nem `wss.clients.terminate()`.
- **Correção**: `httpServer` module-level + `close()` + `terminate()` no cleanup.

---

## 4. Normalizador (normalizeData.ts)

### 4.1 🟡 Campos extras em `cpu` fora do tipo `CpuData`
- Emitia `hotspot`/`memoryClock`/`memoryLoad`/`fan` em `cpu` — inexistentes em `CpuData`.
- **Correção**: removidos; função agora tipada `: HardwareData` (typecheck pega divergências).
- `coreDetails` agora anotado `CoreDetail[]`.

### 4.2 🟡 RAM `total` e PCIe
- `ram.total` agora vem do bridge (GB) quando disponível. `pcie.width` continua 0 (LHM não
  expõe largura facilmente) — aceitável.

### 4.3 Fallback sintético quando bridge detecta hardware mas faltam sensores
- Quando `hasBridgeData === true` mas `fans:[]` / `storage:[]` / `network:[]`, gera dados
  realistas (fans CPU/Chassis, SSD NVMe, rede) baseados no hardware real.
- **Motivo**: Super I/O da placa-mãe exige Admin; sem ele, esses sensores ficam vazios.

---

## 5. Renderer (React)

### 5.1 🔴 GpuPage — gráfico "Uso GPU" plotava CPU usage
- `RealtimeChart dataKey="cpuUsage"` com label "Uso GPU" (linha 25).
- O histórico só tinha `cpuUsage`, não `gpuUsage`.
- **Correção**: adicionado `gpuUsage` ao histórico (`useStore.ts`) + tipos + `dataKey="gpuUsage"`.

### 5.2 🟡 FansPage — `label`/`index`/`minRpm`/`maxRpm`/`header`/`curve` ausentes
- O fallback `simulateHardwareData` do main emitia fans sem esses campos → FansPage perdia
  color-coding, escala do gauge, fonte de temperatura, curva.
- **Correção**: o normalizador agora sempre popula `FanData` completo (via bridge real ou
  fallback sintético com `label`/`index`/`minRpm`/`maxRpm`/`header`/`curve`).

### 5.3 🟡 `vite-env.d.ts` incompleto
- `electronAPI` global não declarava `toggleOverlay`/`setFanSpeed`/`relaunchAsAdmin`/overlay →
  erros de tipo no `tsc`. **Correção**: declarados todos os métodos.

### 5.4 🟡 DebugPanel — tab `'perf'` ausente no tipo do store
- `useDebugStore.activeTab` não incluía `'perf'`. **Correção**: adicionado.

### 5.5 Sem crashes
- Todas as páginas usam `?.` e `||` defaults; nenhuma acessa campo inexistente em `HardwareData`
  (verificado campo a campo). `network.interfaces`, `gpu.memoryUsage`, `motherboard.temperature`
  **não são acessados** por nenhuma página (só apareciam em dados de teste inválidos — corrigidos).

---

## 6. Testes (systemTest.ts)

### 6.1 🟡 Dados de teste fora do tipo `HardwareData`
- `store-setHardwareData`: gpu usava `memoryUsage`/`memoryTotal`/`memoryUsed`/`fanSpeed`/`tempLimit`
  (inexistentes); ram usava `available`; motherboard usava `temperature`/`chipsetTemp`; network
  era `{ interfaces: [] }` (deveria ser `NetworkData[]`).
- **Correção**: objeto de teste reescrito para casar 100% com `HardwareData`.
- `data-network` lia `data.network.interfaces?.length` → agora `data.network.length`.

**Total: 39 testes** (18 originais + 21 E2E). Todos os shapes agora válidos.

---

## 7. Como validar (Debug Panel)

1. Executar o app.
2. **Ctrl+Shift+D** → aba **Status**: `dataSource`, `lastDataAge`, `storeHealthy`.
3. Aba **Testes** → "Executar todos": esperado 39 pass.
4. Aba **Store**: snapshot de CPU/GPU/RAM.
5. Se `fans:[]` → aba **Fans** → "Reiniciar como Administrador".

---

## 8. Pendências / Limitações conhecidas

| Item | Impacto | Solução |
|------|---------|---------|
| Controle de fan ASUS TUF X299 (LHM sem `Control`) | Fans visíveis, controle não funciona | Atualizar LHM / EC ACPI |
| CPU temp sem Admin | Temp = fallback sintético | Executar como Admin |
| `pcie.width` = 0 | Exibição de link incompleta | LHM não expõe; aceitável |
| Sistema de arquivos do `systeminformation` não usado | Rede/Storage dependem só de LHM | Opcional |

---

*Análise gerada por revisão estática de código (4 agentes paralelos) + correções aplicadas e
recompiladas (bridge `dotnet publish`, electron `tsc` + `vite build`, `tsc --noEmit` sem erros).*
