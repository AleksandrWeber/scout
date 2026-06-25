# postMessage and cross-origin messaging

The `window.postMessage` API enables communication between windows and iframes. Without an origin check, any site can send messages your app will accept.

## Insecure pattern

Listening for `message` events and trusting `event.data` without verifying `event.origin` against an allowlist.

## Secure pattern

- Compare `event.origin` to trusted origins only.
- Validate message shape and reject unknown types.
- Never pass message data directly to `innerHTML` or `eval`.

## OWASP mapping

Security Misconfiguration (A05:2021) often applies when messaging boundaries are not enforced.

## Testing

Use browser devtools to post crafted messages from another origin and confirm your handler ignores them.
