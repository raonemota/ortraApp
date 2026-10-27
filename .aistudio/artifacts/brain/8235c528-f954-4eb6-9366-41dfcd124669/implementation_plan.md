# Sistema Clínica Ortra: Autenticação, Hierarquia de Perfis (RBAC), Novos Padrões Visuais e Refinamentos Mobile

Este plano detalha as melhorias estruturais no sistema de gestão e prontuário fisioterapêutico da Clínica Ortra, implementando autenticação real com fluxo de logoff, separação estrita de níveis de acesso por papel, novo cálculo de prefixos/iniciais para profissionais, novo logotipo institucional e refinamentos de layout responsivo.

---

## Decisões Críticas e Diretrizes de Acesso

> [!IMPORTANT]
> **Credenciais Iniciais de Administrador:**
> - **E-mail:** `admin@ortra.com.br`
> - **Senha Padrão:** `admin123` (ou a senha cadastrada pelo gestor)
> Ao realizar o logoff, o sistema redireciona imediatamente para a tela de autenticação segura, permitindo o login tanto do administrador quanto dos fisioterapeutas.

- **Níveis de Acesso e Hierarquia:**
  1. **Administrador Puro (`role: 'admin'`):** Acesso irrestrito a todos os ambientes, incluindo painel administrativo, gestão de equipe, convênios, transferência de carteira, relatórios de auditoria e métricas financeiras globais da clínica.
  2. **Fisioterapeuta (`role: 'physio'`):** Acesso estrito e focado na sua prática clínica — visualiza apenas os pacientes sob sua responsabilidade, seus atendimentos e seu próprio repasse financeiro líquido. O menu "Área Administrativa" fica oculto e protegido contra acesso direto.
  3. **Fisioterapeuta Administrador (`role: 'physio'` com flag `isAdmin: true`):** Acesso híbrido completo — possui agenda clínica e carteira de pacientes própria, mas com permissão de alternar livremente para a Área Administrativa e visualizar relatórios consolidados.

---

## 1. Visão Geral e Experiência do Usuário

### Fluxo de Autenticação & Logoff
* **Botão "Sair do Sistema" (Logoff):** Integrado de forma clara e acessível no menu do usuário (canto superior direito) e na barra mobile, desfazendo a sessão ativa e apresentando a tela de Login da Clínica Ortra.
* **Tela de Login Institucional:** Desenvolvida com a identidade visual da clínica (logotipo oficial, tipografia hospitalar e campos para E-mail e Senha), com indicação das credenciais administrativas de demonstração.
* **Tratamento de Sessão:** Armazena o estado do usuário logado e previne acesso a rotas ou dados restritos sem autenticação válida.

### Prefixo Dr. / Dra. e Inicial Correta no Avatar
* **Problema atual:** Ao salvar o nome como "Dr. Marcelo", o avatar extrai a letra "D", ficando redundante e genérico para todos os profissionais.
* **Solução:**
  * O cadastro passa a solicitar o **Nome Completo** (ex: "Marcelo Carvalho", "Camila Santos") e o **Gênero / Pronome Profissional** (`masculino` -> Dr. | `feminino` -> Dra.).
  * O avatar renderiza a inicial do **primeiro nome real** (ex: "M" para Marcelo, "C" para Camila).
  * O sistema exibe o nome formatado elegantemente como `Dr. Marcelo Carvalho` ou `Dra. Camila Santos`.

---

## 2. Refinamentos Visuais e Responsividade

### Novo Logotipo Institucional
* Download e integração do novo asset:  
  `https://doamjngwapqntdtlkzeo.supabase.co/storage/v1/object/public/configs/LogoClinicaOrtra.png`  
  armazenado em `/public/assets/LogoClinicaOrtra.png` para manter a estrutura do Supabase oculta e garantir carregamento instantâneo.
* Ajuste de altura e proporção no header desktop e mobile.

### Submenu Administrativo com Scroll Horizontal Contínuo
* O menu da Área Administrativa (`Fisioterapeutas & Comissões`, `Transferência de Carteira`, `Convênios & Tabelas`, etc.) será renderizado em linha única horizontal com classe `flex flex-nowrap overflow-x-auto no-scrollbar` e indicadores de rolagem, permitindo navegar confortavelmente em telas menores sem quebra de linhas irregulares.

### Padronização dos Botões de Ações na Tabela de Profissionais
* Os botões de ação (`Nova Senha`, `Inativar/Reativar`, `Excluir`) receberão:
  * Largura fixa/consistente (`w-20` ou `min-w-[76px]`)
  * Altura e tipografia uniformes (`py-1 text-[11px] font-semibold text-center`)
  * Layout em pilha vertical ordenada (`flex flex-col gap-1 items-end`) ou grade alinhada, eliminando desalinhamentos visuais na tabela.

### Correção no Filtro Financeiro Mobile
* No componente de relatórios financeiros, os controles de filtro por paciente e status de pagamento serão reorganizados com `w-full min-w-0 max-w-full flex-col sm:flex-row`, prevenindo overflow horizontal ou corte na tela mobile.

---

## 3. Arquitetura Técnica e Modelo de Dados

### Diagrama de Estados e Acesso

```
┌────────────────────────────────────────────────────────┐
│                   Tela de Login / Logoff               │
│         E-mail + Senha (admin@ortra.com.br)            │
└───────────────────────────┬────────────────────────────┘
                            │ Autenticação Válida
                            ▼
           ┌────────────────────────────────┐
           │        Verificação RBAC        │
           └──────┬──────────────────┬──────┘
                  │                  │
        É Administrador?       É Fisio apenas?
                  │                  │
                  ▼                  ▼
    ┌──────────────────────┐   ┌──────────────────────────┐
    │ Visão Geral + Admin  │   │ Visão Exclusiva do Fisio │
    │ - Todos os pacientes │   │ - Apenas seus pacientes  │
    │ - Relatórios globais │   │ - Apenas seu repasse     │
    │ - Gestão da clínica  │   │ - Sem menu administrativo│
    └──────────────────────┘   └──────────────────────────┘
```

### Alterações nos Tipos (`src/types/index.ts`)
* Atualização de `UserProfile`:
  ```ts
  export interface UserProfile {
    id: string;
    fullName: string;      // Nome sem prefixo (ex: "Marcelo Carvalho")
    gender?: 'M' | 'F';    // Define Dr. ou Dra.
    email: string;
    phone: string;
    role: 'admin' | 'physio';
    isAdmin?: boolean;     // Permite fisioterapeuta com privilégio administrativo
    crefito?: string;
    commissionRate: number;
    mustChangePassword?: boolean;
    hasCompletedTour?: boolean;
    active: boolean;
    createdAt: string;
  }
  ```

---

## Etapas de Execução

1. **Baixar e Configurar o Novo Logo:**
   - Obter `LogoClinicaOrtra.png` e salvar em `/public/assets/LogoClinicaOrtra.png`.
   - Atualizar a referência em `Header.tsx` e tela de login.
2. **Implementar Fluxo de Autenticação (Login / Logoff):**
   - Criar componente `LoginView.tsx` com credenciais administrativas `admin@ortra.com.br` / `admin123`.
   - Adicionar estado de autenticação ativa em `App.tsx` e botão explícito de "Sair do Sistema" (Logoff) no Header e menu mobile.
3. **Refatorar Modelo de Usuários e Separação de Níveis (RBAC):**
   - Ajustar `storageService.ts` para separar `fullName`, `gender` e derivar prefixos (`Dr.` / `Dra.`) sem duplicar a letra "D".
   - Filtrar automaticamente lista de pacientes e relatórios financeiros conforme o perfil ativo.
   - Ocultar abas administrativas para quem não for administrador.
4. **Refinar Área Administrativa & Tabela de Profissionais:**
   - Menu horizontal com `overflow-x-auto whitespace-nowrap`.
   - Padronizar dimensões dos botões de ação (`Nova Senha`, `Inativar`, `Excluir`) com espaçamento vertical.
5. **Corrigir Filtros no Financeiro Mobile:**
   - Ajustar seletores para evitar que o seletor de status ultrapasse a largura da tela em dispositivos compactos.
6. **Verificação & Testes:**
   - Executar testes unitários e validar visualmente via browser nos modos Desktop e Mobile.
