# **`Maritime Finance`**

---

## **The Problem**

Shipping finance is currently trapped in a "black box." A lack of transparent performance data makes short-term lending risky for investors and expensive for shipowners, while traditional settlement delays tie up vital working capital.

## **Business Executive Summary**

Our platform is a decentralized maritime financing system that connects ship owners and investors through standardized, data-driven credit evaluation. We transform shipping voyages into a new class of bankable assets.

By facilitating and scanning on-chain settlements, we establish a Transaction Execution Reliability (TER) score that enables the pricing of short-term, self-liquidating loans against real-time voyage cash flows. This short-term financing aligns with trade and charter cash-flow cycles, allowing capital to be deployed and recycled efficiently.

Enhanced risk visibility and streamlined cross-border transactions support faster funding for ship owners and transparent, flexible yield opportunities for investors. Together, this creates a scalable infrastructure purpose-built for short-term maritime financing.

## **Our Solution**
We’ve built a three-layer system to bring efficiency, reliability, and finance innovation to shipowners on the XRPL. The first layer is our transactional layer, where we manage invoices for each voyage. This layer is kept off-chain to maximize privacy, and it allows shipowners to generate unique payment links that their clients can use to settle invoices quickly and securely.

The second layer adds attestation and on-chain scoring. Here, we track voyage milestones using data such as AIS ship tracking, bills of lading, and other documentation. This lets us verify that each voyage is progressing as expected, and we use that data to calculate a Transaction Execution Reliability score. This TER score is then logged on-chain in a public registry, providing a transparent and verifiable measure of the shipowner’s operational reliability and payment behavior.

Finally, the third layer enables financing. Investors can inject liquidity into voyages based on the shipowner’s TER score. High TER scores signal strong operational performance and cash flow reliability, which allows shipowners to access better loan terms than conventional financing options. Loans are facilitated through escrow logic with built-in safeguards to limit default risk.

In short, our system enables faster and easier settlements, protects sensitive data, and rewards operational excellence with positive financing opportunities — creating a win-win for both shipowners and investors

## [End-to-End Workflow Diagram](https://lucid.app/lucidchart/a581b430-64c4-41db-92aa-0999efcfddcd/edit?viewport_loc=-3014%2C-565%2C7595%2C3687%2Cm-5o7ONTd-nK&invitationId=inv_d698ec09-b9b8-459a-861b-621cb56e2f02)

![Alt text](./content/business_process_flow.svg)

## **Landing Page Image**

![Alt text](./content/landing_page.png)

## **Voyage Dashboard**

<img width="1919" height="948" alt="image" src="https://github.com/user-attachments/assets/397d6638-71de-42ae-ab1f-03904a84c4e8" />

## **Voyage Live Map**

<img width="1919" height="1199" alt="Screenshot 2026-01-09 043007" src="https://github.com/user-attachments/assets/364f415a-befa-43de-bfd5-5dbea5572bf2" />

## **XRPL Features Used and How**

### **Decentralised Identity (DID)**

Decentralised Identity (DID) creation is foundational to our system.

We use on-chain DIDs to represent shipowners as persistent digital identities, allowing us to link verified ownership, historical behaviour, and transaction performance directly on XRPL. **DID for shipowners is generated during onboarding, when they link their wallet through credential creation requests.**

This is what enables us to build **on-chain credit for transactions and loans** at the shipowner level rather than relying on corporate balance sheets or off-chain reputation.

### **RLUSD**

![Uploading image.png…]()

RLUSD settlement is a key enabler of our business model. Stablecoin settlement (atomic settlement) is essential for maritime finance, where predictability and price stability are non-negotiable. Without a native stablecoin like RLUSD in the XRPL ecosystem, our use case would not be commercially viable.

RLUSD allows us to denominate invoices, loans, and repayments in stable value terms while still benefiting from XRPL’s speed, cost efficiency, and programmability.

### [**xrpl.js**](http://xrpl.js)

SDK developer tool

### **Escrows / Native Hooks**

We leveraged XRPL native Hooks to implement flexible and programmable loan logic. Because maritime financing is highly contextual and voyage-based, we needed repayment mechanisms that could adapt to different scenarios.

Hooks allow us to filter and respond to different transaction types, enforce custom repayment conditions, introduce intervention logic when anomalies occur, and support fail-safes or rollovers when predefined conditions are met.

This gives both investors and shipowners a robust, transparent, and automated repayment framework directly on-chain.

### **Multisignature**

* Our mechanism allows for multisignature: Loaning features can be implemented with multisig. Not implemented but is highly relevant for approving loan terms between investor and owner  
* One process, two signatures (2 people involved?)

## **Other Features**

### **Future Works**

* Zero Knowledge Tools  
  * Hides transaction amount
  * Full transparency of our clients will be based on upcoming updates..??

---

## Deployment and Setup

### Prerequisites

- [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)
* TBC

### Dependencies

TBC

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
