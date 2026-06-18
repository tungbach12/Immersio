# Run Harness Audit

Run the ECC harness audit scorecard for this project.

## Usage

```
/run-audit [scope] [--format text|json]
```

- `scope`: `repo` (default), `hooks`, `skills`, `commands`, `agents`
- `--format`: `text` (default) or `json`

## Command

```bash
node scripts/harness-audit.js $ARGUMENTS
```

If no arguments provided, run:

```bash
node scripts/harness-audit.js repo --format text
```

Report the score, failing checks, and top 3 actions to the user.
