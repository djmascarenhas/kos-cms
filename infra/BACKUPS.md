# Backups do KOS CMS

A VPS cria diariamente uma cópia do PostgreSQL e de todos os PDFs armazenados no CMS.

## Política

- horário: 03h30 em `America/Cuiaba` (07h30 UTC);
- retenção local: 30 dias;
- destino: `/opt/kos-cms/backups`;
- banco: formato customizado do `pg_dump`;
- documentos: arquivo `tar.gz`, incluindo versões arquivadas;
- validação: catálogo do PostgreSQL, leitura do `tar.gz` e checksums SHA-256;
- concorrência: um bloqueio impede duas execuções simultâneas.

Cada diretório final contém `database.dump`, `documents.tar.gz`, `metadata.txt` e `checksums.sha256`. O atalho `latest` aponta para a cópia mais recente validada.

## Verificação manual

Execute como `root` na VPS:

```sh
/bin/sh /opt/kos-cms/app/infra/scripts/verify-kos-cms-backup.sh
```

## Recuperação

Uma restauração deve ser feita em janela de manutenção, com cópia adicional do estado atual e confirmação explícita do diretório de origem. O banco e os documentos devem ser restaurados juntos para manter as referências aos PDFs consistentes.

As cópias locais protegem contra falha da aplicação e exclusões acidentais, mas não contra perda total da VPS. Uma cópia externa criptografada deve ser configurada em uma etapa separada, após a escolha do provedor de armazenamento.
