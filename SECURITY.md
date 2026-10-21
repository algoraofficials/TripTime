# 🛡️ Security Policy

At **TripTime** (maintained by **Algora Officials**), we take the security and privacy of our users, partners, and booking infrastructure very seriously. Because TripTime handles sensitive travel itineraries, personal identification data, and payment transactions across hotels, homes, car rentals, flights, and ship bookings, maintaining a secure platform is our top priority.

---

## 📌 Supported Versions

Only the latest stable and actively maintained branches of **TripTime** receive security patches and updates.

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| `1.x.x` (Latest / `main`) | ✅ Yes | Actively Maintained |
| `< 1.0` | ❌ No              | End of Life |

---

## 🚨 Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

If you discover a security vulnerability within TripTime, please disclose it responsibly by contacting our security team directly:

* 📧 **Email:** [algoraofficials@gmail.com](mailto:algoraofficials@gmail.com)
* 🔒 **GitHub Private Vulnerability Reporting:** Navigate to the [Security tab](https://github.com/algoraofficials/TripTime/security) of this repository and click **"Report a vulnerability"**.

### What to Include in Your Report

To help us triage and resolve the issue as quickly as possible, please include:

1. **Type of Vulnerability:** (e.g., SQL Injection, XSS, IDOR, Authentication Bypass, Payment Manipulation, SSRF).
2. **Affected Module:** Specify which service is affected (e.g., Hotel Booking, Vacation Homes, Car Rental, Flight Ticketing, Ship/Cruise Reservations, Checkout/Payment Gateway, or Vendor Portal).
3. **Location:** The full URL, API endpoint, or file path/line number in the source code related to the issue.
4. **Step-by-Step Reproduction:** Clear instructions, proof-of-concept (PoC) scripts, payloads, or screenshots/videos demonstrating the exploit.
5. **Potential Impact:** An explanation of how an attacker could exploit the vulnerability and what data or functionality is at risk.

---

## ⏱️ Response & Disclosure Timeline

When you submit a vulnerability report, you can expect the following workflow:

* **Acknowledgment:** Within **48 hours** of receiving your report.
* **Triage & Assessment:** Within **5–7 business days**, we will validate the issue, determine its severity, and inform you of our remediation plan.
* **Resolution & Patching:** Critical vulnerabilities (especially those affecting payments, authentication, or PII) are prioritized for immediate patching.
* **Public Disclosure:** Once a fix has been deployed and verified, we will coordinate with you on public disclosure and credit your contribution in our security advisories (if desired).

---

## 🎯 Scope & High-Priority Areas

We are particularly interested in vulnerabilities affecting the following core areas of **TripTime**:

### ✅ In Scope
* **Authentication & Session Management:** JWT/OAuth flaws, privilege escalation between Traveler, Host/Vendor, and Admin roles.
* **Booking & Pricing Logic:** Price manipulation during checkout, unauthorized booking modifications, or double-booking race conditions across Hotels, Homes, Cars, Flights, and Ships.
* **Access Control (IDOR / BOLA):** Unauthorized access to another user's e-tickets, passport/ID documents, invoices, or booking history.
* **Payment Gateway Integrations:** Webhook spoofing, signature bypass, or transaction state manipulation.
* **Data Exposure:** Leakage of API keys, database credentials, or Personally Identifiable Information (PII).

### ❌ Out of Scope
* Denial of Service (DoS / DDoS) attacks or automated brute-force flooding.
* Social engineering or phishing attacks targeting Algora Officials staff or users.
* Missing security headers or best-practice configurations that do not lead to a demonstrable exploit.
* Vulnerabilities in third-party dependencies where no working proof-of-concept affects TripTime directly.

---

## 🔐 Security Best Practices for Contributors

If you are contributing code to the **TripTime** repository, please ensure you follow these guidelines:

1. **Never Commit Secrets:** Do not commit `.env` files, API keys (Google Maps, Stripe, SSLCommerz, GDS credentials), or database URLs. Always use `.env.example` with placeholder values.
2. **Validate & Sanitize Inputs:** Sanitize all search parameters, booking dates, passenger details, and file uploads on both client and server sides.
3. **Secure Dependencies:** Run `npm audit` (or your package manager's equivalent) before submitting pull requests to ensure no known vulnerable packages are introduced.

---

## ⚖️ Safe Harbor

We support safe harbor for security researchers who act in good faith. If you conduct security testing in accordance with this policy—avoiding privacy violations, service disruption, and data destruction—we will consider your research authorized and will not initiate legal action against you.
