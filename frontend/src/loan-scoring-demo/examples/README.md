# Loan Scoring Demo Examples

This folder contains five plain JSON loan applications for the isolated loan-scoring demo subsystem.

1. `classic_shop_inventory_purchase`: strong `brw_001` electronics accessories order, marketplace repayment, insured-goods collateral, and a 70% loan-to-invoice advance rate.
2. `medium_apparel_retailer_transaction`: medium `brw_002` apparel transaction with inventory collateral, mixed sales channels, and an 80-85% advance rate.
3. `weak_thin_file_risky_order`: weak `brw_003` borrower with a materially larger-than-usual invoice, longer tenor, unfamiliar product type, and no collateral.
4. `large_plausible_wholesale_shipment`: good `brw_004` borrower with a larger wholesale shipment, warehouse receipt collateral, and distributor repayment source.
5. `hard_stop_duplicate_invoice_demo`: plausible `brw_005` transaction with `demo_scenario` set to `hard_stop`; `inventLoanScoringInput` generates an invoice number ending in `9`, which triggers the mock CDI hard-stop flag.

`_example_name` and `_description` are documentation-only metadata fields. `inventLoanScoringInput` ignores fields whose names start with `_`.
