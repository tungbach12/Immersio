# Evals

Automated evaluation fixtures for critical Immersio flows.

## Structure

```
evals/
  auth/          JWT + refresh token flows
  scenarios/     AI roleplay scenario responses
  flashcards/    SRS scheduling logic
```

## Running

```bash
cd immersioFe && npm run lint   # Frontend type-check
dotnet test                     # Backend unit tests
```
