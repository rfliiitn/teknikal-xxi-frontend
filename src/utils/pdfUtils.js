import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatPeriode = () => {
  const now = new Date();
  return now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
};

const addSignatureAndSave = (doc, settings, outletName, filename, mode = 'save') => {
  const finalY = doc.lastAutoTable.finalY + 20;
  const pageWidth = doc.internal.pageSize.width;
  const leftX = 20;
  const rightX = pageWidth - 65;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('YANG MEMBUAT', leftX, finalY);
  doc.text('MENGETAHUI', rightX, finalY);

  doc.line(leftX, finalY + 22, leftX + 50, finalY + 22);
  doc.line(rightX, finalY + 22, rightX + 50, finalY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text((settings?.yang_membuat_nama || '').toUpperCase(), leftX, finalY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.yang_membuat_divisi || '', leftX, finalY + 32);

  doc.setFont('helvetica', 'bold');
  doc.text((settings?.yang_mengetahui_nama || '').toUpperCase(), rightX, finalY + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.yang_mengetahui_divisi || '', rightX, finalY + 32);

  if (mode === 'preview') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`${filename}-${(outletName || 'outlet').replace(/ /g, '_')}.pdf`);
  }
};

// ── ORDER PDF ──
const buildOrderDoc = (orders, settings, outletName) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN DATA ORDER BARANG', pageWidth / 2, 14, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(14, 17, pageWidth - 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nama Outlet : ${(outletName || '-').toUpperCase()}`, 14, 23);
  doc.text(`Periode     : ${formatPeriode()}`, 14, 29);

  autoTable(doc, {
    startY: 33,
    head: [['NO', 'NAMA BARANG', 'JUMLAH', 'TGL ORDER', 'TGL DITERIMA', 'NO FPKB', 'STATUS', 'KETERANGAN']],
    body: orders.map((o, i) => [
      i + 1,
      o.nama_barang?.toUpperCase() || '',
      o.jumlah_barang,
      o.tanggal_order,
      o.tanggal_diterima || '-',
      o.no_fpkb || '-',
      o.status_barang?.toUpperCase() || '',
      o.keterangan || '-'
    ]),
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [0,0,0], lineWidth: 0.3 },
    headStyles: { fillColor: [255,255,255], textColor: [0,0,0], fontStyle: 'bold', lineWidth: 0.3, fontSize: 8 },
    columnStyles: { 1: { cellWidth: 45 }, 7: { cellWidth: 30 } },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = orders[data.row.index];
        if (data.column.index === 6) {
          data.cell.styles.textColor = row?.status_barang === 'Sudah Diterima' ? [0,128,0] : [200,0,0];
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  return doc;
};

export const generateOrderPDF = (orders, settings, outletName) => {
  addSignatureAndSave(buildOrderDoc(orders, settings, outletName), settings, outletName, 'LAPORAN_ORDER', 'save');
};

export const previewOrderPDF = (orders, settings, outletName) => {
  addSignatureAndSave(buildOrderDoc(orders, settings, outletName), settings, outletName, 'LAPORAN_ORDER', 'preview');
};

// ── MAINTENANCE PDF ──
const buildMaintenanceDoc = (items, settings, outletName) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN DATA MAINTENANCE', pageWidth / 2, 14, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(14, 17, pageWidth - 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nama Outlet : ${(outletName || '-').toUpperCase()}`, 14, 23);
  doc.text(`Periode     : ${formatPeriode()}`, 14, 29);

  autoTable(doc, {
    startY: 33,
    head: [['NO', 'TANGGAL', 'MAINTENANCE', 'PETUGAS', 'KETERANGAN']],
    body: items.map((m, i) => [i + 1, m.tanggal, m.maintenance?.toUpperCase() || '', m.petugas?.toUpperCase() || '-', m.keterangan || '-']),
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0,0,0], lineWidth: 0.3, textColor: [0,0,0] },
    headStyles: { fillColor: [255,255,255], textColor: [0,0,0], fontStyle: 'bold', lineWidth: 0.3 },
    columnStyles: { 2: { cellWidth: 55 }, 3: { cellWidth: 35 }, 4: { cellWidth: 60 } },
    margin: { left: 14, right: 14 }
  });

  return doc;
};

export const generateMaintenancePDF = (items, settings, outletName) => {
  addSignatureAndSave(buildMaintenanceDoc(items, settings, outletName), settings, outletName, 'LAPORAN_MAINTENANCE', 'save');
};

export const previewMaintenancePDF = (items, settings, outletName) => {
  addSignatureAndSave(buildMaintenanceDoc(items, settings, outletName), settings, outletName, 'LAPORAN_MAINTENANCE', 'preview');
};