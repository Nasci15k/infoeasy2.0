# Objetivo do Plano

O usuário solicitou separar completamente a configuração de módulos/consultas VIP do site e do bot do Telegram:
1. No site, por padrão nenhuma consulta será VIP (quem compra o painel/créditos acessa tudo), a menos que seja especificamente ativado no painel admin.
2. No Telegram, continuarão existindo restrições VIP.
3. Se um usuário comum tentar usar consulta VIP no Bot, exibir uma mensagem de aviso mais clara ("negado").
4. Nova interface total para gerenciar o Bot no Painel de Admin contendo: edição de nome/descrição, envio de broadcast para usuários (5, 15, 30 dias ou todos) e controle de módulos e planos VIP do Telegram.

## User Review Required

> [!IMPORTANT]
> - O layout no painel do administrador ficará com uma nova aba dedicada "Bot Telegram" (onde toda configuração descrita ocorrerá).
> - As consultas do Site passarão a ser validadas por uma **nova** configuração (`is_web_vip`), que deixaremos inicialmente `false` (desativada) para todos os módulos e categorias, conforme solicitado. Já o Telegram continuará utilizando a mesma tag existente.

## Proposed Changes

### Database Modifications
#### [NEW] `supabase/migrations/20260423000001_bot_web_vip_separation.sql`
- Adicionar coluna `is_web_vip` boolean (default false) na tabela `api_categories`.
- Adicionar coluna `is_web_vip` boolean (default false) na tabela `apis`.
- Adicionar coluna `last_bot_interaction` timestamptz na tabela `profiles`. 
*(Isso permitirá rastrear os usuários do Telegram para enviar transmissões / broadcast nas janelas de tempo desejadas).*

### Edge Functions
#### [MODIFY] `supabase/functions/bot-handler/index.ts`
- Atualizar campo `last_bot_interaction` do perfil do usuário sempre que houver comunicação.
- Alterar o aviso restritivo VIP tanto na Categoria quanto no Módulo para deixar claro ao usuário comum ("⚠️ ACESSO NEGADO - Módulo VIP").

#### [MODIFY] `supabase/functions/register-bots/index.ts` (ou criar nova)
- Adicionar lógica para a ação `send_broadcast` (enviar mensagem em massa buscando os perfis que interagiram nos últimos X dias no Telegram).
- Adicionar lógica para `update_bot_info` (chamando APIs do Telegram `setMyName` e `setMyDescription`).

### Componentes Frontend (Web)
#### [NEW] `src/components/admin/AdminTelegramBotTab.tsx`
Criar a nova aba administrativa focada puramente no Bot:
- **Metadados:** Inputs para alterar Nome, Descrição e About do Bot.
- **Broadcast:** Envio de mensagem em massa, com filtro de usuários do Telegram (últimos 5 dias, 15 dias, 30 dias ou sempre).
- **Módulos VIP do Bot:** Tabela simples para habilitar/desabilitar quais módulos e categorias são `is_vip` (VIP do Telegram).
- **Planos VIP do Bot:** Tabela para criar/editar apenas planos do tipo "telegram" (preço, duração, nome).

#### [MODIFY] `src/pages/Admin.tsx`
- Integrar e exibir a aba `AdminTelegramBotTab.tsx` substituindo as opções parciais atuais.

#### [MODIFY] `src/components/dashboard/CategoryModule.tsx`
- Alterar as verificações de `is_vip` para lerem de `is_web_vip`. Como todos iniciarão "false", não vai prender consultas no site.

#### [MODIFY] `src/components/admin/AdminProductsTab.tsx`
- Mudar/separar a visualização da tag "VIP". No painel "Produtos", referir-se apenas ao `is_web_vip` a partir de agora, dando ao admin a opção de bloquear uma API específica de forma customizada pro Site.

## Open Questions

> [!WARNING]
> 1. Posso agrupar a configuração de "Planos VIP do Site" na aba normal e manter os de "Planos VIP do Bot" exclusivamente nessa nova tela do Bot que será construída?
> 2. Podemos proceder com as alterações deste plano?

## Verification Plan
### Automated & Manual Verification
- Testar a criação de produtos e validações do site (garantindo que não estão exigindo VIP por padrão).
- Usar um usuário de teste não-VIP no Telegram e verificar se a nova resposta de aviso "Acesso Negado" é exibida.
- Enviar Mensagem via interface de Broadcast nos filtros de dias.
- Alterar o nome e descrição do Bot pelo Admin.
