# Banco institucional

O KOS CMS usa PostgreSQL como fonte de verdade institucional. A primeira migração cria o núcleo necessário para documentos, conferências, planejamento e rastreabilidade entre as deliberações e os instrumentos de gestão.

## Aplicação

Depois de provisionar um PostgreSQL 16+ e definir `DATABASE_URL` no ambiente:

```powershell
npm.cmd run db:apply
npm.cmd run db:seed
```

Não há propostas da 9ª Conferência incluídas como dados de exemplo. Elas devem ser registradas somente a partir do Relatório Final oficial, preservando texto, eixo, paginação e demais evidências.

## Entidades iniciais

- `documents` e `document_types`: documentos e sua procedência;
- `conferences`, `conference_axes`, `conference_proposals`: deliberações de conferências;
- `health_plans` e `annual_programs`: PMS e PAS;
- `traceability_links`: análise proposta a proposta, com justificativa e fonte;
- `audit_logs`: trilha de auditoria para mudanças futuras.
