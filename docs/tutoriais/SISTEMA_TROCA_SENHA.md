# 🔒 Sistema de Troca de Senha - Primeiro Login

## 📋 Visão Geral

Sistema de segurança que força usuários a trocarem a senha temporária no primeiro acesso.

## ✨ Funcionalidades

- ✅ **Senha temporária** gerada automaticamente ao criar usuário
- ✅ **Troca obrigatória** no primeiro login
- ✅ **Validação forte** de senha com requisitos de segurança
- ✅ **Indicador visual** de força da senha
- ✅ **Bloqueio de acesso** até trocar a senha
- ✅ **Interface amigável** com instruções claras

## 🔐 Requisitos de Senha

Para garantir segurança, a nova senha deve ter:

- ✅ **Mínimo 8 caracteres**
- ✅ **Pelo menos 1 letra maiúscula** (A-Z)
- ✅ **Pelo menos 1 letra minúscula** (a-z)
- ✅ **Pelo menos 1 número** (0-9)
- ✅ **Diferente da senha temporária**

### Exemplos de Senhas Válidas

- `Senha123` ✅
- `MinhaSenha2024` ✅
- `Favela@123` ✅
- `Admin2024!` ✅

### Exemplos de Senhas Inválidas

- `senha123` ❌ (falta maiúscula)
- `SENHA123` ❌ (falta minúscula)
- `SenhaForte` ❌ (falta número)
- `Senha1` ❌ (menos de 8 caracteres)

## 🚀 Fluxo de Uso

### Para Administradores (Criar Usuário)

1. **Acesse o Painel de Gestão**
   - Login como Admin/Dono
   - Vá em "Gestão" (Admin Panel)

2. **Crie Novo Usuário**
   - Clique em "Criar Usuário"
   - Preencha email e cargo
   - Sistema gera senha temporária automaticamente

3. **Copie a Senha Temporária**
   - ⚠️ **IMPORTANTE:** Copie a senha IMEDIATAMENTE
   - Exemplo: `Senha8x4k2a!`
   - Envie para o novo usuário de forma segura

4. **Informe o Usuário**
   - Envie email e senha temporária
   - Informe que ele DEVE trocar a senha no primeiro login

### Para Novos Usuários (Primeiro Login)

1. **Faça Login**
   - Use o email fornecido
   - Use a senha temporária recebida

2. **Tela de Troca de Senha**
   - Sistema detecta primeiro login automaticamente
   - Tela laranja/vermelha aparece

3. **Preencha os Campos**
   - **Senha Atual:** Cole a senha temporária
   - **Nova Senha:** Crie sua senha segura
   - **Confirmar:** Digite a nova senha novamente

4. **Verifique os Requisitos**
   - Indicadores mostram se senha atende requisitos
   - Barra de força mostra qualidade da senha:
     - 🔴 **Fraca** - Não recomendado
     - 🟡 **Média** - Aceitável
     - 🟢 **Forte** - Recomendado

5. **Confirme a Troca**
   - Clique em "Alterar Senha e Continuar"
   - Aguarde confirmação
   - Sistema redireciona para dashboard

## 🎨 Interface

### Tela de Primeiro Login

```
╔═══════════════════════════════════╗
║       🔒 PRIMEIRA VEZ?            ║
║                                   ║
║  Por segurança, altere sua        ║
║  senha temporária                 ║
╚═══════════════════════════════════╝

📋 Senha Atual (Temporária)
[___________________________]

📋 Nova Senha
[___________________________]
Força: ████████░░ Forte 🟢

📋 Confirmar Nova Senha
[___________________________]

📋 Requisitos da senha:
✓ Mínimo 8 caracteres
✓ Uma letra maiúscula
✓ Uma letra minúscula
✓ Um número

[🔒 Alterar Senha e Continuar]
```

## 🔧 Configuração Técnica

### Banco de Dados

Campo `first_login` na tabela `users`:
- `true` = Precisa trocar senha
- `false` = Já trocou senha

### Script SQL

Execute no Supabase SQL Editor:

```sql
-- Adicionar campo
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Usuários existentes (já fizeram login)
UPDATE users 
SET first_login = false 
WHERE first_login IS NULL;
```

### Fluxo Técnico

1. Admin cria usuário → `first_login = true`
2. Usuário faz login → Sistema verifica `first_login`
3. Se `true` → Mostra tela de troca de senha
4. Usuário troca senha → `first_login = false`
5. Próximos logins → Vai direto para dashboard

## 🛡️ Segurança

### Validações Implementadas

- ✅ Senha não pode ser igual à anterior
- ✅ Senhas devem coincidir
- ✅ Requisitos mínimos obrigatórios
- ✅ Feedback visual em tempo real
- ✅ Bloqueio de acesso até trocar senha

### Boas Práticas

**Para Administradores:**
- Envie senha temporária por canal seguro
- Não reutilize senhas temporárias
- Oriente usuários sobre requisitos
- Verifique se usuário conseguiu trocar senha

**Para Usuários:**
- Troque a senha imediatamente
- Use senha única (não reutilize)
- Não compartilhe sua senha
- Use gerenciador de senhas se possível

## 📊 Indicador de Força

O sistema mostra força da senha em tempo real:

### Fraca (🔴 33%)
- Apenas requisitos mínimos
- Exemplo: `Senha123`

### Média (🟡 66%)
- Requisitos + comprimento maior
- Exemplo: `MinhaSenha2024`

### Forte (🟢 100%)
- Todos requisitos + caracteres especiais
- Exemplo: `Favela@2024!Forte`

## 🐛 Problemas Comuns

### "As senhas não coincidem"
**Solução:** Digite exatamente a mesma senha nos dois campos

### "A senha deve ter pelo menos 8 caracteres"
**Solução:** Use senha mais longa

### "A senha deve conter pelo menos uma letra maiúscula"
**Solução:** Adicione A-Z na senha

### "A senha deve conter pelo menos um número"
**Solução:** Adicione 0-9 na senha

### "A nova senha deve ser diferente da senha atual"
**Solução:** Crie senha completamente diferente da temporária

### Não consigo ver a senha digitada
**Solução:** Clique no ícone de olho (👁️) para mostrar/ocultar

## 🎯 Dicas

1. **Use frases memoráveis**
   - Exemplo: `MinhaFavela2024!`
   - Fácil de lembrar, difícil de adivinhar

2. **Combine palavras e números**
   - Exemplo: `Sorte123Favela`
   - Mais seguro que palavras simples

3. **Adicione caracteres especiais**
   - Exemplo: `Favela@Sorte2024!`
   - Aumenta força significativamente

4. **Evite informações pessoais**
   - ❌ Não use: nome, data nascimento, telefone
   - ✅ Use: frases aleatórias com números

5. **Anote em local seguro**
   - Use gerenciador de senhas
   - Ou anote em papel guardado com segurança

## 📱 Responsividade

Sistema funciona perfeitamente em:
- 💻 Desktop
- 📱 Celular
- 📱 Tablet

## 🔄 Atualização de Senha Posterior

Após o primeiro login, usuários podem trocar senha:
- Através do painel de configurações (em desenvolvimento)
- Solicitando reset de senha por email

## ✅ Checklist de Implementação

- [x] Campo `first_login` no banco
- [x] Componente `ChangePassword`
- [x] Validação de senha forte
- [x] Indicador de força visual
- [x] Integração com fluxo de login
- [x] Atualização automática após troca
- [x] Mensagens de erro claras
- [x] Interface responsiva
- [x] Documentação completa

## 📞 Suporte

Se tiver problemas:
1. Verifique se executou o script SQL
2. Confirme que campo `first_login` existe
3. Teste com usuário novo
4. Verifique console do navegador (F12)

---

**Versão:** 2.0
**Status:** ✅ Funcional
**Última Atualização:** 2024
**Segurança:** 🔒 Alta
