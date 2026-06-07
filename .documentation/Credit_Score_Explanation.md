The credit score is calculated not per company but per loan request and results from two linked scores.

| Section                                                                           | Data point                                                                                                                                  | Contribution to total score | Data source |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------: | ----------- |
| **Borrower score — basic internal / public / basic document data**                | Past repayment history (on our platform)                                                                                                    |                     **20%** | s           |
|                                                                                   | Current exposure on our platform: outstanding principal, open loans, repayment schedule                                                     |                     **10%** | s           |
|                                                                                   | Business age and operating continuity: incorporation date, active status, basic company history                                             |                      **5%** | g + c       |
|                                                                                   | Legal/compliance status: registration status, winding-up risk, litigation/adverse public records where available                            |                      **4%** | g           |
|                                                                                   | Basic borrower identity and KYB consistency: company name, directors, ownership, address, account identity                                  |                      **2%** | g + c       |
| **Borrower score — CDI / consented transaction data**                             | CDI-observed business activity continuity: recent trade/payment/logistics activity indicating the company is still operating normally       |                      **4%** | CDI         |
| **Borrower subtotal**                                                             |                                                                                                                                             |                     **45%** |             |
| **Transaction score — basic internal / public / basic transaction document data** | Loan-to-invoice / advance-rate reasonableness: requested loan amount vs invoice/purchase order value                                        |                      **8%** | s + c       |
|                                                                                   | Collateral/recovery quality: collateral coverage, liquidity, enforceability, insurance, control over goods where applicable                 |                     **10%** | s + c       |
|                                                                                   | Order normality based on our platform history: transaction size, tenor, product type, and borrower behaviour vs prior financed transactions |                      **7%** | s + c       |
|                                                                                   | Basic transaction completeness: purchase order, invoice, supplier identity, delivery terms, loan purpose, expected repayment source         |                      **5%** | c           |
| **Transaction score — CDI / consented transaction data**                          | Verified trade/shipment data: CDI, cargo records, invoices, customs/trade declarations, shipment status                                     |                     **14%** | CDI         |
|                                                                                   | Supplier reliability: delivery history, dispute rate, cancellation/delay history                                                            |                      **4%** | CDI + s     |
|                                                                                   | CDI-based order normality: supplier, route, cargo type, shipment size, and trade pattern vs observed history                                |                      **4%** | CDI         |
|                                                                                   | Buyer/customer/channel concentration risk                                                                                                   |                      **3%** | CDI         |
| **Transaction subtotal**                                                          |                                                                                                                                             |                     **55%** |             |
| **Total**                                                                         |                                                                                                                                             |                    **100%** |             |
Data source legend:
- "s" : Data thats available in our database from past loans
- "g" : Data that should be available in government registers
- "c" : Basic data the company that wants a loan needs to provide
	- At registration:
		- Business identification numbers (for government register lookups - also maybe tax id etc)
		- basic "what are we info" (business goal / operational description)
		- History of the Business - List of director, company name, ownership and address also historically since the company existed
	- Per transaction
		- Purchase order value + invoice receipt 
		- supplier identity
		- collateral situation (optional - can be proof of insurance somewhere else or allocation of collateral deposited at our service)
		- product type
		- expected delivery time
		- expected repayment source
- "CDI" : Data from the CDI api

The company also has to specify per loan:
- Loan amount
- Loan duration