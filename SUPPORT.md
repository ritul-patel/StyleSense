# Support

## How to Get Help

### 1. Check the Documentation First

Before opening an issue, please check:

- [README.md](README.md) - project overview, setup, architecture, and API reference
- [CONTRIBUTING.md](CONTRIBUTING.md) - development setup and coding standards
- [docs/trd.md](docs/trd.md) - technical requirements and API contracts
- [docs/backend_integration_architecture.md](docs/backend_integration_architecture.md) - service layer, error handling, and security patterns

### 2. Search Existing Issues

Your question may already be answered in a [closed GitHub Issue](../../issues?q=is%3Aissue+is%3Aclosed). Search before creating a new one.

### 3. Open a GitHub Issue

If you've read the docs and searched existing issues:

- **Bug?** → Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md) template
- **Feature idea?** → Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md) template
- **Question?** → Open a blank issue with a clear title and all relevant context

---

## Common Setup Issues

### Server won't start

- Check that all required variables in `server/.env` are set (see `server/.env.example`)
- Run `npm --prefix server run migrate up` to apply database migrations
- Verify your Supabase project is active and the connection string is correct

### Client can't reach the API

- Confirm `NEXT_PUBLIC_API_URL` in `client/.env.local` points to `http://localhost:4000/api/v1` in development
- Confirm the Express server is running on port 4000 (`npm run dev:server`)
- Check browser console for CORS errors - the server only allows `localhost:3000` and `localhost:3001` in development

### Gemini AI calls failing

- Verify `GEMINI_API_KEY` is set in `server/.env`
- Check that the model name in `GEMINI_MODEL` matches an available model in your Google AI Studio project
- The service logs every request with `[gemini:req#N]` - check your server console for error details

### Database migration errors

- Ensure `DATABASE_URL` is a valid PostgreSQL connection string
- If using Supabase, use the **direct connection** URL (not the pooler URL) for migrations

---

## Response Times

This is an actively developed personal project. Response times are best-effort:

| Channel | Expected Response |
|---|---|
| GitHub Issues (bug) | 2–5 business days |
| GitHub Issues (feature) | 1–2 weeks |
| Pull Requests | 3–7 business days |
