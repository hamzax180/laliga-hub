# 📤 Email Service (Brevo)

We use the Brevo (Sendinblue) API v3 for high-deliverability transactional emails.

## Technical Transition
- **Legacy**: Originally used Nodemailer with SMTP relays.
- **Current**: Direct HTTP/HTTPS calls using `axios`.
- **Reason**: Cloud providers and Kubernetes environments often block port 587/465 (SMTP). Using a REST API is more resilient and security-compliant.

## Configuration
- **Endpoint**: `https://api.brevo.com/v3/smtp/email`
- **Security**: The API Key is stored in a Kubernetes Secret and injected as `EMAIL_PASS`.
- **HTML Templates**: Custom HTML templates are generated server-side for the "Welcome" email, featuring branding and responsive layout.
