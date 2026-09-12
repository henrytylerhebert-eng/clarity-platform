# Accepted synthetic operating fixture

`dunder-mifflin-2026.json` is a read-only extraction from **Dunder Mifflin Hospital - Restored Operations 2026.xlsx**, accepted SHA-256 `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`.

The 31 tables contain 28,301 synthetic records, including fictional TV-character patients. Workbook contracts are synthetic examples, even where a payer name references a government program. Official payment inputs are separately archived in `../public-rates/`.

Regenerate with an environment containing openpyxl:

```sh
python scripts/extract-operating-workbook.py '/absolute/path/to/accepted.xlsx' data/synthetic-revops/dunder-mifflin-2026.json
```

The script reads input cells, formula expressions and cached values without saving or modifying Excel. Runtime metadata identifies editable inputs, immutable receipt history and original formula snapshots. Source hashes and source row locations remain attached. The operating service computes its summaries independently; it does not execute Excel formulas or treat original formula caches as current results after corrections.

Imported record IDs remain immutable. New payer/service/contract records use `platform:` IDs and `sourceRow: 0`, displayed as Platform in the UI. Twenty tables have editable inputs, two retain immutable signed receipt history, and nine are reference report snapshots. Source formula cells in mixed input tables are also immutable. Native Excel recalculation of the accepted source is outside these extraction tests.
