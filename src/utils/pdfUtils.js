import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateFilmPDF = (films, settings, outletName) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DATA FILM', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Outlet: ${outletName || '-'}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Judul Film', 'Status Tayang', 'Format Film', 'Status KDM']],
    body: films.map((f, i) => [
      i + 1,
      f.judul_film,
      f.status_tayang,
      f.format_film,
      f.status_kdm
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = films[data.row.index];
        if (row?.status_tayang === 'Sedang Tayang') {
          data.cell.styles.fillColor = [198, 239, 206];
        } else if (row?.status_tayang === 'Sudah Tayang') {
          data.cell.styles.fillColor = [255, 199, 206];
        }
      }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 20;
  const pageWidth = doc.internal.pageSize.width;

  // Signature section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const leftX = 40;
  const rightX = pageWidth - 80;

  doc.text('Yang Membuat,', leftX, finalY);
  doc.text('Yang Mengetahui,', rightX, finalY);

  doc.text('\n\n\n', leftX, finalY + 5);

  const ymNama = settings?.yang_membuat_nama || '.....................';
  const ymDiv = settings?.yang_membuat_divisi || '.....................';
  const ykNama = settings?.yang_mengetahui_nama || '.....................';
  const ykDiv = settings?.yang_mengetahui_divisi || '.....................';

  doc.text(ymNama, leftX, finalY + 30);
  doc.text(ymDiv, leftX, finalY + 36);

  doc.text(ykNama, rightX, finalY + 30);
  doc.text(ykDiv, rightX, finalY + 36);

  doc.save(`data-film-${outletName || 'outlet'}.pdf`);
};

export const generateOrderPDF = (orders, settings, outletName) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DATA ORDER BARANG', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Outlet: ${outletName || '-'}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Nama Barang', 'Jumlah', 'Tgl Order', 'Tgl Diterima', 'Status', 'Keterangan']],
    body: orders.map((o, i) => [
      i + 1,
      o.nama_barang,
      o.jumlah_barang,
      o.tanggal_order,
      o.tanggal_diterima || '-',
      o.status_barang,
      o.keterangan || '-'
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const row = orders[data.row.index];
        if (row?.status_barang === 'Sudah Diterima') {
          data.cell.styles.fillColor = [198, 239, 206];
        } else {
          data.cell.styles.fillColor = [255, 199, 206];
        }
      }
    }
  });

  addSignature(doc, settings, outletName, 'data-order');
};

export const generateMaintenancePDF = (items, settings, outletName) => {
  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DATA MAINTENANCE', doc.internal.pageSize.width / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Outlet: ${outletName || '-'}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });

  autoTable(doc, {
    startY: 28,
    head: [['No', 'Tanggal', 'Maintenance', 'Keterangan']],
    body: items.map((m, i) => [i + 1, m.tanggal, m.maintenance, m.keterangan]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
  });

  addSignature(doc, settings, outletName, 'data-maintenance');
};

const addSignature = (doc, settings, outletName, filename) => {
  const finalY = doc.lastAutoTable.finalY + 20;
  const pageWidth = doc.internal.pageSize.width;
  const leftX = 30;
  const rightX = pageWidth - 70;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Yang Membuat,', leftX, finalY);
  doc.text('Yang Mengetahui,', rightX, finalY);

  const ymNama = settings?.yang_membuat_nama || '.....................';
  const ymDiv = settings?.yang_membuat_divisi || '.....................';
  const ykNama = settings?.yang_mengetahui_nama || '.....................';
  const ykDiv = settings?.yang_mengetahui_divisi || '.....................';

  doc.text(ymNama, leftX, finalY + 30);
  doc.text(ymDiv, leftX, finalY + 36);
  doc.text(ykNama, rightX, finalY + 30);
  doc.text(ykDiv, rightX, finalY + 36);

  doc.save(`${filename}-${outletName || 'outlet'}.pdf`);
};
