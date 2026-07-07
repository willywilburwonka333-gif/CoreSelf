# Real AI Brain

Genesis 0.1.2 adds the first security layer for Core Self.

## Rules

- Dylan stays in control.
- Cloud data is scoped to the signed-in Firebase user.
- Dangerous actions are blocked by default.
- Cloud sync requires approval.
- External tools require future explicit permissions.
- Important actions are logged in the audit log.

## Firestore path

`/users/{uid}/core/{store}`

## Production rules

Use the `firestore.rules` file before public use.
