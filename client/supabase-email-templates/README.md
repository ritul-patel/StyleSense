# Supabase Email Templates for StyleSense

## How to Apply

These templates must be configured manually in the Supabase Dashboard.

### Steps:

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **Email Templates**
2. For each template below, paste the HTML content into the corresponding template editor.

### Templates:

| Template | File | Supabase Template Name |
|----------|------|----------------------|
| Email Verification | `confirm-signup.html` | **Confirm signup** |
| Password Reset | `reset-password.html` | **Reset password** |

### Template Variables

Supabase uses Go template syntax. The following variables are used:

- `{{ .ConfirmationURL }}` - The full URL the user must click to confirm their action.

### Email Subjects

Configure these subjects in the Supabase Dashboard:

| Template | Subject Line |
|----------|-------------|
| Confirm signup | `Verify your email - StyleSense` |
| Reset password | `Reset your password - StyleSense` |

### Redirect URLs

Ensure these redirect URLs are configured in **Authentication** → **URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://stylesense.co.in` |
| Redirect URLs | `https://stylesense.co.in/auth-check/callback` |
| Redirect URLs | `https://stylesense.co.in/settings` |
| Redirect URLs | `https://stylesense.co.in/reset-password` |

For local development, also add:
- `http://localhost:3000/auth-check/callback`
- `http://localhost:3000/settings`
- `http://localhost:3000/reset-password`

### Templates NOT needed

The following are not used by StyleSense:
- Magic Link - not implemented
- Email Change - not implemented in UI
- Invite User - not used

Leave these at Supabase defaults or disable them.
