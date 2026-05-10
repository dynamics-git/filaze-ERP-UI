# Purchase Invoice Field Mapping

## Header API

`/purchaseInvoiceHeaders`

## Line API

`/purchaseInvoiceLines`

## Header Key Fields

- `SystemId`
- `No`

## Line Relation Fields

- `DocumentNo`
- Line parent should match header `No`

## Mapping Table

| ERP Core Field | Business Meaning | Real API Field | Used In |
| --- | --- | --- | --- |
| `No` | Purchase invoice document number | `No` | Header |
| `VendorName` | Buy-from Vendor Name / Vendor Name | TODO: confirm exact API field name | Header |
| `VendorInvoiceNo` | Vendor Invoice No | TODO: confirm exact API field name | Header |
| `PostingDate` | Posting Date | TODO: confirm exact API field name | Header |
| `DueDate` | Due Date | TODO: confirm exact API field name | Header |
| `Status` | Status | TODO: confirm exact API field name | Header |
| `CurrencyCode` | Currency Code | TODO: confirm exact API field name | Header |
| `AmountIncludingVAT` | Amount Including VAT | TODO: confirm exact API field name | Header |
| `Type` | Purchase line type | TODO: confirm exact API field name | Lines |
| `No` | Line item/account/resource number | TODO: confirm exact API field name | Lines |
| `Description` | Line description | TODO: confirm exact API field name | Lines |
| `Quantity` | Line quantity | TODO: confirm exact API field name | Lines |
| `DirectUnitCost` | Direct Unit Cost | TODO: confirm exact API field name | Lines |
| `LineAmount` | Line Amount | TODO: confirm exact API field name | Lines |
| `VATPercent` | VAT % | TODO: confirm exact API field name | Lines |
| `DimensionSetID` | Dimension Set ID | TODO: confirm exact API field name | Lines |
| `DocumentNo` | Parent purchase invoice document number | `DocumentNo` | Lines |
