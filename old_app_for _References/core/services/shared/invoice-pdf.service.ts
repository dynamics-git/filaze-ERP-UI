import { Injectable } from "@angular/core";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

@Injectable({
  providedIn: "root",
})
export class InvoicePdfService {
  constructor() { }
  safe(v: any) {
    return v === null || v === undefined ? "" : String(v);
  }

  async InvoicePDF(
    header: any,
    vendor: any,
    company: any,
    lines: any[],
    vatSummary: any[],
    shipTo: any
  ) {
    const doc = new jsPDF("p", "pt");

    // Helpers
    const safe = (v: any) =>
      v === null || v === undefined ? "" : String(v);
    const num = (v: any) => (isNaN(Number(v)) ? 0 : Number(v));

    const margin = 40;
    let y = margin;

    // ---------------------------------------------------------
    // VENDOR BLOCK
    // ---------------------------------------------------------
    doc.setFont("Segoe UI", "normal");
    doc.setFontSize(8);

    const vendorLines = [
      vendor.Name,
      vendor.Contact,
      vendor.Address,
      vendor.Address2,
      `${vendor.City}, ${vendor.PostCode}`,
      vendor.Country,
    ].filter((x) => safe(x));

    vendorLines.forEach((line) => {
      doc.text(safe(line), margin, y);
      y += 12;
    });

    // ---------------------------------------------------------
    // TITLE + PAGE #
    // ---------------------------------------------------------
    doc.setFont("Segoe UI", "bold");
    doc.setFontSize(14);
    doc.text("Purchase - Invoice", 400, margin, { align: "left" });

    doc.setFont("Segoe UI", "normal");
    doc.setFontSize(8);
    doc.text("Page 1", 400, margin + 18);

    // ---------------------------------------------------------
    // COMPANY INFORMATION (RIGHT SIDE)
    // ---------------------------------------------------------
    y = margin + 40;
    const compX = 400;

    doc.setFont("Segoe UI", "normal");
    doc.setFontSize(8);

    const compLines = [
      company.name,
      company.address,
      company.address2,
      company.city,
      company.postCode,
      company.countryRegionCode,
    ].filter((x) => safe(x));

    compLines.forEach((line) => {
      doc.text(safe(line), compX, y);
      y += 12;
    });

    y += 10;

    const compMeta = [
      ["Phone No.", company.phoneNo],
      ["Home Page", company.homePage],
      ["Email", company.eMail],
      ["VAT Registration No.", company.vatRegistrationNo],
      ["Giro No.", company.giroNo],
      ["Bank", company.bankName],
      ["Account No.", company.bankAccountNo],
    ];

    compMeta.forEach(([label, value]) => {
      doc.setFont("Segoe UI", "normal");
      doc.text(label, compX, y);
      doc.setFont("Segoe UI", "normal");
      doc.text(safe(value), compX + 100, y);
      y += 12;
    });

    // ---------------------------------------------------------
    // LEFT META BLOCK (Invoice Info)
    // ---------------------------------------------------------
    let metaY = margin + vendorLines.length * 12 + 55;

    const leftMeta = [
      ["Pay-to Vendor No.", header.PayToVendorNo],
      ["Invoice No.", header.No],
      ["Order No.", header.OrderNo],
      ["Document Date", this.formatDate(header.DocumentDate)],
      ["Posting Date", header.PostingDate],
      ["Due Date", header.DueDate],
    ];

    leftMeta.forEach(([label, value]) => {
      doc.setFont("Segoe UI", "normal");
      doc.text(label, margin, metaY);
      doc.setFont("Segoe UI", "normal");
      doc.text(safe(value), margin + 100, metaY);
      metaY += 14;
    });

    metaY += 8;

    const leftMeta2 = [
      ["Payment Terms", header.PaymentTerms],
      ["Shipment Method", header.ShipmentMethod],
      ["Prices Including VAT", header.PricesIncludingVAT ? "Yes" : "No"],
    ];

    leftMeta2.forEach(([label, value]) => {
      doc.setFont("Segoe UI", "normal");
      doc.text(label, margin, metaY);
      doc.setFont("Segoe UI", "normal");
      doc.text(safe(value), margin + 100, metaY);
      metaY += 14;
    });

    y = metaY + 20;

    // ---------------------------------------------------------
    // LINE TABLE (EXACT BC REPORT LAYOUT)
    // ---------------------------------------------------------
    autoTable(doc, {
      startY: y,
      margin: { left: margin },
      styles: {
        fontSize: 9,
        lineColor: [255, 255, 255],
        lineWidth: 0.2,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [255, 255, 255],  // white
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0,                // no default borders
      },

      didDrawCell: (data) => {
        // Draw ONLY bottom border of header
        if (data.section === "head") {
          const doc = data.doc;
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.2);
          doc.line(x, y + height, x + width, y + height); // bottom border only
        }
      },

      head: [[
        "No.",
        "Description",
        "Quantity",
        "Unit of Measure",
        "Direct Unit Cost",
        "Discount %",
        "Allow Invoice Discount",
        "VAT Identifier",
        "Amount"
      ]],

      body: lines.map(l => [
        this.safe(l.No),
        this.safe(l.Description),
        this.safe(l.Quantity),
        this.safe(l.Unit),
        this.safe(l.DirectUnitCost),
        this.safe(l.LineDiscount),
        l.AllowInvoiceDisc ? "Yes" : "No",
        this.safe(l.VATIdentifier),
        this.safe(l.Amount)
      ])
    });


    y = (doc as any).lastAutoTable.finalY + 25;

    // ---------------------------------------------------------
    // TOTALS (EXACT BC ALIGNMENT)
    // ---------------------------------------------------------
    let totalExcl = 0;
    let totalVat = 0;

    lines.forEach((l) => (totalExcl += num(l.Amount)));
    vatSummary.forEach((v) => (totalVat += num(v.VATAmount)));

    const totalIncl = totalExcl + totalVat;

    const labelX = 370;
    const amountX = 550;

    doc.setFont("Segoe UI", "bold");
    doc.setFontSize(10);

    doc.text("Total USD Excl. VAT", labelX, y);
    doc.setFont("Segoe UI", "bold");
    doc.text(totalExcl.toFixed(2), amountX, y, { align: "right" });

    y += 18;

    doc.setFont("Segoe UI", "normal");
    const vatPercent = vatSummary.length ? vatSummary[0].VATPercent : 0;
    doc.text(`${vatPercent}% VAT`, labelX, y);
    doc.setFont("Segoe UI", "normal");
    doc.text(totalVat.toFixed(2), amountX, y, { align: "right" });


    // ---------- DRAW LINE ----------
    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.2);
    doc.line(labelX, y, amountX, y);


    y += 18;

    doc.setFont("Segoe UI", "bold");
    doc.text("Total USD Incl. VAT", labelX, y);
    doc.text(totalIncl.toFixed(2), amountX, y, { align: "right" });

    y += 30;

    // ---------------------------------------------------------
    // VAT AMOUNT SPECIFICATION (WITH TOTAL ROW)
    // ---------------------------------------------------------
    doc.setFont("Segoe UI", "bold");
    doc.setFontSize(12);
    doc.text("VAT Amount Specification", margin, y);

    y += 14;

    autoTable(doc, {
      startY: y,
      margin: { left: margin },
      styles: {
        fontSize: 9,
        lineColor: [255, 255, 255],
        lineWidth: 0.2,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [255, 255, 255],  // white
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0,                // no default borders
      },

      didDrawCell: (data) => {
        const doc = data.doc;
        const { x, y, width, height } = data.cell;

        // HEADER bottom border only
        if (data.section === "head") {

          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(1.2);
          doc.line(x, y + height, x + width, y + height); // bottom border only
        }

        // BODY thin row borders
        if (data.section === "body") {

          // NORMAL BODY ROW BORDER
          // if (data.row.index < data.table.body.length - 1) {
          //   doc.setDrawColor(255, 255, 255);
          //   doc.setLineWidth(1.2);
          //   doc.line(x, y + height, x + width, y + height);
          // }

          // === TOTAL ROW SEPARATION ===
          if (data.row.index === data.table.body.length - 1) {
            // Draw thick line ABOVE TOTAL row
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(1.2);
            doc.line(x, y, x + width, y);
          }
        }
      },

      head: [
        [
          "VAT Identifier",
          "VAT %",
          "Line Amount",
          "Inv. Disc. Base Amount",
          "Invoice Discount Amount",
          "VAT Base",
          "VAT Amount",
        ],
      ],

      body: [
        ...vatSummary.map((v) => [
          safe(v.VATIdentifier),
          safe(v.VATPercent),
          safe(v.LineAmount),
          safe(v.InvDiscBaseAmount),
          "0.00",
          safe(v.VATBase),
          safe(v.VATAmount),
        ]),

        // TOTAL ROW — final row
        [
          "Total",
          "",
          vatSummary.reduce((a, b) => a + num(b.LineAmount), 0).toFixed(2),
          vatSummary.reduce((a, b) => a + num(b.InvDiscBaseAmount), 0).toFixed(2),
          "0.00",
          vatSummary.reduce((a, b) => a + num(b.VATBase), 0).toFixed(2),
          vatSummary.reduce((a, b) => a + num(b.VATAmount), 0).toFixed(2),
        ],
      ],
    });



    y = (doc as any).lastAutoTable.finalY + 25;

    // ---------------------------------------------------------
    // SHIP-TO ADDRESS
    // ---------------------------------------------------------
    doc.setFont("Segoe UI", "bold");
    doc.setFontSize(12);
    doc.text("Ship-to Address", margin, y);

    y += 14;

    doc.setFont("Segoe UI", "normal");
    doc.setFontSize(10);

    [
      shipTo.Name,
      shipTo.Address,
      shipTo.Address2,
      shipTo.City,
      shipTo.PostCode,
      shipTo.Country,
    ]
      .filter((x) => safe(x))
      .forEach((line) => {
        doc.text(safe(line), margin, y);
        y += 12;
      });

    doc.save(`Purchase_Invoice_${safe(header.No)}.pdf`);
  }


  formatDate(v: any) {
    if (!v) return "";

    // If object: {year:2024,month:3,day:10}
    if (typeof v === "object" && v.year && v.month && v.day) {
      const y = v.year;
      const m = String(v.month).padStart(2, "0");
      const d = String(v.day).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    // If normal date: "2024-03-10T00:00:00"
    const date = new Date(v);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }


}
