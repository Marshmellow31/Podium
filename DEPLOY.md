# Deploying Podium

## Required configuration

Configure these values in `.env.local` and in the hosting environment:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_DEFAULT_ORG_ID`
- `VITE_ADMIN_SECRET`
- `VITE_USE_EMULATOR=false`

`VITE_` values are included in the browser bundle. Authorization is enforced by
`firestore.rules`, not by hiding client configuration.

## Release checks

```powershell
npm.cmd ci
npm.cmd run verify
npm.cmd run build
npm.cmd run validate:vercel
```

The Firestore emulator requires Java 21 or newer:

```powershell
npm.cmd run test:rules
```

Deploy Firestore rules and indexes explicitly. A bare Firebase deploy also tries
to deploy Functions, which requires the Blaze plan.

```powershell
firebase.cmd deploy --only firestore:rules,firestore:indexes --project forge-4d40a
```

## Legacy fixture cleanup

The repository no longer contains fixture seed data. For an older Firebase
project, inspect the cleanup first and then apply it with an Admin SDK credential:

```powershell
$env:ORG_ID='your_organization_id'
npm.cmd run remove-demo-data
npm.cmd run remove-demo-data -- --apply
```

The script removes only fixed legacy fixture IDs. It does not delete the
organization, roles, invitations, or unrelated registrations and submissions.

## Rollback triggers

Roll back when public challenge discovery fails, authenticated members lose
their expected permissions, or registration/submission writes are denied for a
valid participant. Restore the previous rules release in Firebase, then restore
the previous application deployment. Deleted fixture records are intentionally
not restored.
