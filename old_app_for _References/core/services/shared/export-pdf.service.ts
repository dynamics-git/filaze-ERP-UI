import { Injectable } from '@angular/core';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { TableHeader } from '../../models/shared/tableHeader';

@Injectable({
  providedIn: 'root'
})
export class ExportPdfService {

  constructor() { }

  exportTableToPdf(headers: TableHeader[], data: any[], title: string) {
    const doc = new jsPDF('l', 'pt');
    const columns = headers.map((h: TableHeader) => {
      return h.name;
    });
    const columnsWidth = headers.map((h: TableHeader) => {
      return { cellWidth: 50 };
    });

    let pdfData: string[][] = [];
    data.forEach((record: any) => {
      let row: string[] = [];
      headers.forEach((header: TableHeader) => {
        row.push(this.convertData(record[header.prop]));
      });
      pdfData.push(row);
    });

    autoTable(doc, {
      head: [columns],
      body: pdfData,
      margin: {
        left: 50,
        top: 50,
        bottom: 50
      },
      headStyles: {
        fontSize: 12
      }
    });

    doc.save(title + '.pdf');
  }

  convertData(data: string): string {
    const date = new Date(data);
    if (typeof data === 'string' && !isNaN(date.getTime()) && data.includes('-') && data.includes(':')) {
      return date.toLocaleDateString();
    } else {
      return data;
    }
  }
}
