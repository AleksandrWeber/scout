# Injection and XSS in JavaScript apps

Cross-site scripting (XSS) happens when untrusted data is rendered as HTML or script in the browser. In React, `dangerouslySetInnerHTML`, unsanitized `innerHTML`, and template literals injected into DOM APIs are common sources.

## Prevention

- Prefer React's default escaping and JSX text nodes.
- Sanitize HTML with a vetted library (DOMPurify) when rich HTML is required.
- Never pass user input directly to `eval`, `Function`, or dynamic `require`.
- Validate and encode output based on context: HTML, attribute, URL, JavaScript.

## OWASP mapping

Injection (A03:2021) covers XSS when attacker-controlled input reaches an interpreter or browser HTML context without validation.

## Quick fix checklist

1. Identify the data source (user input, URL param, API response).
2. Remove dangerous sinks or sanitize at the trust boundary.
3. Add a regression test with a malicious payload such as `<img src=x onerror=alert(1)>`.
