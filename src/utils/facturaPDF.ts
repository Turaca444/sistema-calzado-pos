import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Sale, Customer } from "../types";

export function exportFacturaB(sale: Sale, customer?: Customer) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Formatting dates
    const saleDate = new Date(sale.date);
    const formattedDateStr = saleDate.toLocaleDateString("es-AR");
    const formattedTimeStr = saleDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    // --- Header Section Layout ---
    // Outer Border
    doc.setDrawColor(100, 116, 139); // slate-500
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 190, 277);

    // Centered "B" Letter Box (AFIP Standard style)
    // A4 width is 210mm. Center is 105mm. Box is 16mm wide, 16mm high.
    // X goes from 97 to 113. Y goes from 10 to 26.
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(51, 65, 85); // slate-700
    doc.rect(97, 10, 16, 16, "DF");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text("B", 102.5, 21.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("COD. 006", 105, 25, { align: "center" });

    // Vertical line below the center box dividing company and invoice details
    doc.setDrawColor(148, 163, 184); // slate-300
    doc.setLineWidth(0.3);
    doc.line(105, 26, 105, 58);

    // --- LEFT SIDE: Company Details (Issuer) ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229); // brand indigo-600
    doc.text("J&Z INDUMENTARIA", 15, 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("J&Z Indumentaria S.A.S.", 15, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Dirección: Av. Santa Fe 1234, CABA, Argentina", 15, 32);
    doc.text("Teléfono: +54 11 2345-6789", 15, 36);
    doc.text("Email: administracion@jyzindumentaria.com", 15, 40);
    
    // IVA status
    doc.setFont("helvetica", "bold");
    doc.text("Condición IVA: IVA Responsable Inscripto", 15, 46);

    // --- RIGHT SIDE: Invoice Header Details ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("FACTURA", 115, 20);

    doc.setFontSize(9);
    // Sale ID as clean Invoice number: padded with zeros
    const numericId = sale.id.replace(/[^0-9]/g, "");
    const formattedInvoiceNum = numericId ? numericId.slice(-8).padStart(8, "0") : "00000102";
    doc.text(`Nro. Comprobante: 0001-${formattedInvoiceNum}`, 115, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Fecha de Emisión: ${formattedDateStr} ${formattedTimeStr}`, 115, 32);
    doc.text("CUIT: 30-71458963-2", 115, 36);
    doc.text("Ingresos Brutos: 30-71458963-2", 115, 40);
    doc.text("Inicio de Actividades: 15/01/2026", 115, 44);

    // Horizontal Separator
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.4);
    doc.line(10, 58, 200, 58);

    // --- Customer / Client Details Box ---
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(10, 58, 190, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text("RECEPTOR / CLIENTE", 15, 64);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Nombre / Razón Social: `, 15, 70);
    doc.setFont("helvetica", "bold");
    doc.text(sale.customerName, 52, 70);

    doc.setFont("helvetica", "normal");
    // Fallbacks for phone & email
    const emailStr = customer?.email || (sale.customerId === "cust_anonymous" ? "consumidor@final.com" : "");
    const phoneStr = customer?.phone || (sale.customerId === "cust_anonymous" ? "-" : "");

    doc.text(`Email: ${emailStr || "-"}`, 15, 75);
    doc.text(`Teléfono: ${phoneStr !== "-" ? phoneStr : "No especificado"}`, 15, 80);

    // Right side of Customer Box
    doc.text("Condición frente al IVA: ", 115, 70);
    doc.setFont("helvetica", "bold");
    doc.text("Consumidor Final", 152, 70);

    doc.setFont("helvetica", "normal");
    doc.text("CUIT/DNI: ", 115, 75);
    doc.text(sale.customerId === "cust_anonymous" ? "99-99999999-9" : "DNI / CUIL Registrado", 132, 75);

    doc.text("Condición de Venta: ", 115, 80);
    doc.setFont("helvetica", "bold");
    let methodLabel = "Contado (Efectivo)";
    if (sale.paymentMethod === "transferencia") methodLabel = "Transferencia Bancaria";
    else if (sale.paymentMethod === "cuenta_corriente") methodLabel = "Cuenta Corriente";
    doc.text(methodLabel, 144, 80);

    // Horizontal separator
    doc.setDrawColor(100, 116, 139);
    doc.line(10, 86, 200, 86);

    // --- Itemized Products Table ---
    const tableHeaders = [["Cód. Prod.", "Descripción / Detalle del Artículo", "Cant.", "U. Medida", "Precio Unitario", "Subtotal"]];
    const tableRows = sale.items.map((it, idx) => {
      const code = it.productId ? it.productId.slice(-6).toUpperCase() : `IND-${idx + 1}`;
      return [
        code,
        it.productName,
        it.quantity.toString(),
        "unidades",
        `$${it.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$${(it.price * it.quantity).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 92,
      margin: { left: 10, right: 10 },
      theme: "striped",
      headStyles: {
        fillColor: [51, 65, 85], // slate-700
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
        halign: "left"
      },
      bodyStyles: {
        fontSize: 8.5,
        valign: "middle"
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 75, fontStyle: "bold" },
        2: { cellWidth: 15, halign: "center" },
        3: { cellWidth: 20 },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 30, halign: "right", fontStyle: "bold" }
      },
      didDrawPage: (data) => {
        // We will draw the footer in standard absolute terms inside this callback or afterwards
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // --- Invoice Summary and Totals Box ---
    // Make sure we have space for totals, CAE, and footer
    const totalsY = finalY + 8;
    
    doc.setDrawColor(203, 213, 225); // slate-200
    doc.setLineWidth(0.3);
    doc.line(10, totalsY - 3, 200, totalsY - 3);

    // Left block of totals: informative legal text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("El IVA se encuentra discriminado e incluido en el importe total según Ley de Factura Tipo B.", 15, totalsY + 3);
    doc.text("Comprobante oficial no fiscal generado para uso interno y administrativo.", 15, totalsY + 7);

    // Right block of totals
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("Subtotal:", 140, totalsY + 3);
    doc.setFont("helvetica", "normal");
    doc.text(`$${sale.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, 195, totalsY + 3, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("Descuentos / Recargos:", 140, totalsY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`$0,00`, 195, totalsY + 8, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("IMPORTE TOTAL:", 140, totalsY + 15);
    doc.text(`$${sale.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, 195, totalsY + 15, { align: "right" });

    // --- Fake CAE (AFIP validation lookalike) ---
    // Position this at the bottom inside the outer box (around Y = 250)
    const footerStartY = 248;

    // Draw solid line above CAE section
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.4);
    doc.line(10, footerStartY, 200, footerStartY);

    // CAE Block Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("CAE Nº:", 135, footerStartY + 6);
    doc.setFont("helvetica", "normal");
    // Generate simulated CAE code
    const generatedCAE = "76281900248" + numericId.slice(-3).padStart(3, "0") + "4";
    doc.text(generatedCAE, 150, footerStartY + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Fecha Vto. CAE:", 135, footerStartY + 11);
    doc.setFont("helvetica", "normal");
    // CAE expiration is 10 days after sale date
    const caeDueDate = new Date(saleDate);
    caeDueDate.setDate(caeDueDate.getDate() + 10);
    doc.text(caeDueDate.toLocaleDateString("es-AR"), 160, footerStartY + 11);

    // Fake Barcode Layout on the left bottom side
    doc.setFont("helvetica", "bold");
    doc.text("Comprobante Autorizado por AFIP", 15, footerStartY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Código de Barras de Transacción Electrónica:", 15, footerStartY + 11);

    // Drawing fake barcode lines!
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    const barcodeX = 15;
    const barcodeY = footerStartY + 13;
    const barcodeHeight = 10;
    
    // Draw a bunch of thin and thick lines
    const barcodePattern = [1, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
    let currentX = barcodeX;
    barcodePattern.forEach((width, index) => {
      doc.setLineWidth(width * 0.35);
      if (index % 2 === 0) {
        doc.line(currentX, barcodeY, currentX, barcodeY + barcodeHeight);
      }
      currentX += width * 0.6;
    });

    // Barcode numbers below
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`3071458963206${generatedCAE}20260715`, 15, footerStartY + 26);

    // Final signature brand stamp
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    doc.text("J&Z INDUMENTARIA S.A.S.", 135, footerStartY + 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("¡Gracias por confiar en nosotros!", 135, footerStartY + 24);

    // Save File
    doc.save(`Factura_B_${formattedInvoiceNum}_${sale.customerName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("Error generating Factura B PDF:", error);
  }
}
