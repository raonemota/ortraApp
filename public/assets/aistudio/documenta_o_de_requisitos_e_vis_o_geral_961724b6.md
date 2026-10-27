# Documentação de Requisitos e Visão Geral (Conceitual)
**Projeto:** Sistema de Gestão e Prontuário Eletrônico para Fisioterapia (Web App)  
**Instituição de Referência:** Clínica Ortra (Lauro de Freitas - BA)

---

## 1. Visão Geral do Sistema
O objetivo deste projeto é desenvolver uma aplicação web moderna, intuitiva e altamente segura voltada para o controle clínico e financeiro de fisioterapeutas dentro de uma clínica. O sistema é dividido em dois módulos principais: **Área Administrativa** (gestão de acessos e configurações da clínica) e **Área do Fisioterapeuta** (gestão de pacientes, prontuário eletrônico completo e controle financeiro de sessões).

A experiência do usuário (UX/UI) deve refletir a solidez e o acolhimento institucional de mais de 30 anos de atuação da Clínica Ortra no segmento ortopédico e de reabilitação.

---

## 2. Perfis de Usuário (Atores)
1. **Administrador:** Responsável por gerenciar os profissionais cadastrados, definir parâmetros globais da clínica e manter as configurações do sistema.
2. **Fisioterapeuta:** Profissional de saúde responsável pelo atendimento, cadastro de pacientes, registro de avaliações (anamnese, exame físico, conduta), evolução diária de sessões e acompanhamento de seus ganhos financeiros.

---

## 3. Requisitos Funcionais (RF)

### 3.1. Módulo Administrativo
* **RF01 - Cadastro de Fisioterapeutas:** O administrador poderá cadastrar novos profissionais informando nome completo, e-mail, telefone e número do CREFito.
* **RF02 - Fluxo de Primeiro Acesso e Senha Provisória:** Ao concluir o cadastro de um profissional, o sistema deve disparar automaticamente um e-mail contendo uma senha temporária ou link de definição de senha. No primeiro login, o sistema **forçará** a troca da senha antes de liberar o acesso ao painel.
* **RF03 - Tour Guiado (Onboarding):** No primeiro acesso (após a troca de senha), o sistema exibirá um tour interativo apresentando as principais funcionalidades da plataforma. O status de conclusão do tour deve ser salvo no banco de dados (`has_completed_tour = true`) para garantir que seja exibido apenas uma vez (com opção de ser revisto no menu de ajuda).

#### 💡 Sugestões Adicionais para a Área Administrativa (Antecipação de Necessidades):
1. **Gestão de Convênios e Tabelas de Preços:** Cadastro dos planos de saúde aceitos pela clínica e valores base de procedimentos (particular vs. convênio) para padronizar o lançamento financeiro dos fisioterapeutas.
2. **Regras de Comissionamento / Repasse:** Campo no cadastro do fisioterapeuta para definir a porcentagem de repasse (ex: 60% fisioterapeuta / 40% clínica), automatizando o cálculo líquido no relatório financeiro.
3. **Gestão de Status do Profissional (Inativação e Transferência de Carteira):** Caso um fisioterapeuta saia da clínica, o administrador pode inativar seu acesso sem excluir o histórico clínico (obrigatório por lei/COFFITO) e transferir facilmente os pacientes ativos dele para outro profissional da equipe.
4. **Personalização de Documentos (White-label institucional):** Logotipo da Clínica Ortra, dados de contato e CNPJ fixados automaticamente no cabeçalho de relatórios, recibos ou fichas de avaliação impressas/PDF.
5. **Logs de Auditoria Simplificados:** Visualização de quem acessou ou alterou dados críticos, garantindo conformidade com a LGPD.

---

### 3.2. Módulo do Fisioterapeuta

#### A. Gestão de Pacientes e Checklist Inicial
* **RF04 - Cadastro Administrativo do Paciente (Tela 1):** Registro de dados cadastrais contendo:
  * Nome Completo
  * CPF (com validação de formato)
  * Data de Nascimento (cálculo automático de idade)
  * Telefone / WhatsApp
  * Convênio (ou Particular)
  * Contato de Emergência (Nome, Parentesco e Telefone)
  * Profissão
* **RF05 - Checklist de Integração do Paciente:** Imediatamente após cadastrar o paciente, o sistema deve apresentar um checklist rápido de pendências iniciais que o fisioterapeuta deve validar (ex: *[ ] Termo de Consentimento / LGPD assinado*, *[ ] Documento de identificação verificado*, *[ ] Regras de faltas e reposições explicadas*, *[ ] Primeira Avaliação agendada/realizada*).

#### B. Prontuário Eletrônico e Nova Avaliação (Tela 2)
Dentro do perfil do paciente, haverá o botão **"Nova Avaliação"** (permitindo múltiplas avaliações ao longo do tempo para histórico comparativo). A tela será estruturada em **3 Abas ou Blocos Expansíveis (Accordions)**:

* **RF06 - Aba 1: Anamnese (Avaliação Subjetiva):**
  * **QP (Queixa Principal):** Campo de texto focado no motivo resumido da consulta.
  * **HDA (História da Doença Atual):** Campo detalhado sobre início da dor, fatores de melhora e piora.
  * **HPP (Histórico Patológico Pregresso):** Registro de cirurgias prévias, comorbidades e doenças crônicas (diabetes, hipertensão, etc.).
  * **Medicamentos em Uso e Exames Complementares:** Campo de texto livre + área de upload para anexar arquivos (PDFs de laudos e imagens de exames no Supabase Storage).
  * **Hábitos de Vida:** Prática de atividade física, qualidade do sono, tabagismo, etilismo, postura laboral.

* **RF07 - Aba 2: Exame Físico (Avaliação Objetiva):**
  * **EVA (Escala Visual Analógica de Dor):** Componente visual interativo (slider ou seletor numérico/colorido de $0$ a $10$).
  * **Inspeção e Palpação:** Registro de edemas, cicatrizes, alterações posturais, trofismo e tensão muscular.
  * **ADM (Amplitude de Movimento) e Goniometria:** Campos estruturados ou descritivos para registro dos graus de movimento articular.
  * **Força Muscular:** Seletor baseado na Escala de Oxford (graduação de $0$ a $5$).
  * **Testes Especiais / Ortopédicos:** Campo livre para descrição de testes específicos (ex.: Lasègue, Phalen, Neer, Gaveta Anterior) e seus resultados (Positivo/Negativo).

* **RF08 - Aba 3: Diagnóstico e Plano (Conclusão e Conduta):**
  * **Diagnóstico Cinético-Funcional:** Conclusão clínica específica da fisioterapia.
  * **Objetivos do Tratamento:** Divididos ou descritos em metas de curto, médio e longo prazo.
  * **Conduta / Plano Terapêutico:** Definição dos recursos e técnicas que serão aplicados nas sessões (cinesioterapia, eletroterapia, terapia manual, pilates, etc.).

#### C. Acompanhamento e Evolução Diária
* **RF09 - Evolução de Sessão:** Tela ágil e simplificada acessada a cada visita do paciente. Deve conter:
  * Data e hora do atendimento (preenchimento automático com opção de edição).
  * Descrição rápida da conduta realizada no dia.
  * Estado do paciente ao início e ao final da sessão (incluindo opção rápida de EVA do dia).
  * Status da sessão (Realizada, Falta Justificada, Falta Não Justificada) e valor da sessão (pré-preenchido conforme cadastro/acordo, mas editável).

#### D. Controle Financeiro do Fisioterapeuta
* **RF10 - Registro de Valor por Sessão:** Possibilidade de definir um valor padrão por sessão ou pacote no perfil do paciente, ou lançar o valor individualmente a cada evolução registrada.
* **RF11 - Aba de Relatórios Financeiros:** Painel dedicado onde o fisioterapeuta visualiza seus ganhos. Deve incluir:
  * Filtros por período (diário, semanal, mensal, personalizado), por paciente e por status de pagamento (Pago / Pendente).
  * Totalizador de sessões realizadas no período.
  * Cálculo de faturamento bruto (e líquido, caso haja regra de comissão da clínica).
  * Opção de exportar relatório simples (CSV ou PDF).

---

## 4. Requisitos Técnicos, Arquitetura e Identidade Visual

### 4.1. Identidade Visual e Design System (Base Clínica Ortra)
A interface deve seguir a identidade limpa, confiável e humanizada da Clínica Ortra, transmitindo precisão médica e bem-estar:

* **Paleta de Cores Institucional:**
  * **Azul Petróleo / Marinho Clínico (Primária):** Utilizado em cabeçalhos, barras de navegação principal, botões primários de ação e tipografia de títulos principais (transmite credibilidade, estabilidade e autoridade médica).
  * **Ciano / Azul Turquesa Claro (Secundária / Destaque):** Utilizado em botões de ação secundária, badges informativos, seleção de abas ativas e realces em gráficos de evolução.
  * **Verde Clínico / Saúde (Sucesso e Apoio):** Indicadores de status positivos, sessões concluídas, pagamentos confirmados e metas atingidas.
  * **Laranja / Âmbar Suave (Alerta e Chamada):** Utilizado moderadamente para alertas de pendências, checklists não concluídos e botões de chamada rápida (ex.: ações urgentes ou novo agendamento).
  * **Neutros e Fundos:** Fundo da aplicação em tons off-white / cinza muito claro (`#F8FAFC` a `#F1F5F9`), cartões brancos com sombras sutis (`#FFFFFF`), garantindo alto contraste e leitura sem cansaço visual em longos plantões.
* **Tipografia:**
  * Fonte primária sem serifa (sans-serif) moderna, limpa e legível: **Inter**, **Plus Jakarta Sans** ou **Roboto**.
  * Hierarquia tipográfica bem demarcada (pesos Medium e SemiBold para títulos de prontuário e regular para preenchimento de anamnese).
* **Componentes e Layout (UI/UX):**
  * **Accordions / Abas:** Transições suaves ao expandir Anamnese, Exame Físico e Conduta para que o fisioterapeuta não se perca em formulários muito longos.
  * **Slider de Dor (EVA):** Gradiente visual intuitivo que transita do verde (0 - Sem Dor), passando pelo amarelo/laranja (4-6 - Dor Moderada) até o vermelho escuro (10 - Pior Dor Possível).
  * **Responsividade:** Layout *Mobile-First / Tablet-Friendly*, facilitando o preenchimento da evolução na beira da maca ou tablado.

### 4.2. Stack Tecnológica e Infraestrutura
* **RNF01 - Plataforma:** Aplicação Web Responsiva (Web App / PWA), otimizada para desktops, tablets e smartphones.
* **RNF02 - Backend e Banco de Dados:** Utilização do **Supabase** (PostgreSQL para dados relacionais, Supabase Auth para autenticação e gestão de sessões, Supabase Storage para armazenamento de arquivos/exames).

### 4.3. Segurança da Informação e Cibersegurança (Crítico)
Segurança estrita baseada no princípio de *Security by Design* e conformidade com a LGPD:

* **RNF03 - Proteção de Credenciais e Chaves de API:**
  * Nenhuma credencial privada (como a `service_role_key` do Supabase ou credenciais de disparo de e-mail) deve ser colocada no cliente frontend.
  * Uso obrigatório de arquivos `.env` protegidos via `.gitignore`.
  * Criação administrativa de usuários e disparo de senhas provisórias realizadas via **Supabase Edge Functions** (Server-Side) protegidas.
* **RNF04 - Row Level Security (RLS) Obrigatório:**
  * Todas as tabelas do PostgreSQL no Supabase devem ter o **RLS habilitado**.
  * Fisioterapeutas autenticados só podem consultar e manipular registros associados à sua conta ou expressamente compartilhados pela clínica.
* **RNF05 - Armazenamento Seguro de Exames (Storage):**
  * O bucket de documentos clínicos e exames deve ser estritamente **privado**. O download ou visualização deve requerer geração de *Signed URLs* com expiração curta.
* **RNF06 - Prevenção contra Vulnerabilidades Web (OWASP):**
  * Sanitização de entradas em campos abertos para barrar ataques de Cross-Site Scripting (XSS).
  * Auditoria contínua de dependências (`npm audit`).
  * Tráfego 100% criptografado com HTTPS/TLS e armazenamento seguro com criptografia em repouso.

---

## 5. Estrutura Sugerida para o Banco de Dados (Visão Conceitual)

1. `profiles` (Estende `auth.users`): `id`, `full_name`, `role` ('admin' | 'physio'), `crefito`, `commission_rate`, `must_change_password` (boolean), `has_completed_tour` (boolean), `active` (boolean).
2. `patients`: `id`, `physio_id` (FK), `full_name`, `cpf`, `birth_date`, `phone`, `health_insurance`, `emergency_contact`, `profession`, `default_session_value`, `onboarding_checklist` (JSONB).
3. `assessments` (Avaliações): `id`, `patient_id` (FK), `physio_id` (FK), `created_at`, `anamnesis_data` (JSONB), `physical_exam_data` (JSONB), `diagnosis_and_plan` (JSONB).
4. `assessment_files` (Exames): `id`, `assessment_id` (FK), `file_path`, `file_name`, `uploaded_at`.
5. `evolutions` (Sessões e Financeiro): `id`, `patient_id` (FK), `physio_id` (FK), `session_date`, `description`, `pain_scale_eva`, `session_value`, `payment_status` ('pending' | 'paid'), `attendance_status` ('completed' | 'missed').