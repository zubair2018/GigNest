# Gigspot Internal Console

Run locally from the repository root:

```powershell
npm run admin:dev
```

Vite listens on `http://127.0.0.1:5181`. The console uses the existing Firebase client configuration and checks the signed-in user's server-issued `role=admin` custom claim before requesting admin data.

Build the separate console bundle with:

```powershell
npm run admin:build
```

The build output is `dist-admin/`; it is not included in the public Vite build or Firebase Hosting configuration. Do not publish this directory on a public host. Before a real internal deployment, place it behind an authenticated access gateway/IAM policy and an approved internal domain. A hidden URL or `noindex` tag is not access control.

Firebase Console prerequisites: enable the required sign-in providers and add the local/internal domains under Authentication authorized domains. An administrator must receive the Firebase custom claim through a trusted, manually authorized Admin SDK process. The public application has no endpoint for granting admin access.

This internal interface only works when its Cloud Functions have been deployed from `src/functions` and the admin account has the claim. Local tests against production are not run by this app.
