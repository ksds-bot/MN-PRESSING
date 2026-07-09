import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/middleware/auth';
import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

const BRAND_PINK = rgb(200 / 255, 30 / 255, 110 / 255);
const BRAND_DARK = rgb(26 / 255, 26 / 255, 46 / 255);
const GRAY = rgb(100 / 255, 116 / 255, 139 / 255);
const LIGHT_GRAY = rgb(0.94, 0.94, 0.96);

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Reçu',
  WASHING: 'En lavage',
  IRONING: 'En repassage',
  READY: 'Prêt',
  DELIVERED: 'Livré',
};

function formatDate(d: Date | string | null): string {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
}

// GET /api/orders/export/pdf -> PDF des commandes déposées il y a plus de 7 jours
export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth.valid || !auth.user) {
    return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  if (auth.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs' }, { status: 403 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: { depositDate: { lte: sevenDaysAgo } },
      select: {
        receiptNumber: true,
        depositDate: true,
        expectedReturnDate: true,
        status: true,
        totalPrice: true,
        paidAmount: true,
        remainingAmount: true,
        customer: { select: { fullName: true, phoneNumber: true } },
        garments: { select: { id: true } },
      },
      orderBy: { depositDate: 'asc' },
    });

    const totals = orders.reduce(
      (acc, o) => {
        acc.garments += o.garments.length;
        acc.total += o.totalPrice;
        acc.paid += o.paidAmount;
        acc.remaining += o.remainingAmount;
        return acc;
      },
      { garments: 0, total: 0, paid: 0, remaining: 0 }
    );

    // ---------- Construction du PDF ----------
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('MN Pressing - Commandes de plus de 7 jours');
    pdfDoc.setProducer('MN Pressing');

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = PageSizes.A4[0]; // 595.28
    const pageHeight = PageSizes.A4[1]; // 841.89
    const margin = 36;

    // Colonnes du tableau (en points, largeur totale = pageWidth - 2*margin)
    const columns = [
      { key: 'receipt', label: 'Reçu', width: 55 },
      { key: 'client', label: 'Client', width: 95 },
      { key: 'depot', label: 'Dépôt', width: 55 },
      { key: 'prevu', label: 'Prévu', width: 55 },
      { key: 'statut', label: 'Statut', width: 60 },
      { key: 'vetements', label: 'Vêt.', width: 30 },
      { key: 'total', label: 'Total', width: 60 },
      { key: 'paye', label: 'Payé', width: 60 },
      { key: 'reste', label: 'Reste', width: 53 },
    ];
    const tableWidth = columns.reduce((s, c) => s + c.width, 0);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    function drawHeader() {
      // Logo texte "MN Pressing"
      page.drawText('MN', {
        x: margin,
        y: y - 22,
        size: 22,
        font: fontBold,
        color: BRAND_DARK,
      });
      const mnWidth = fontBold.widthOfTextAtSize('MN ', 22);
      page.drawText('Pressing', {
        x: margin + mnWidth,
        y: y - 22,
        size: 22,
        font: fontBold,
        color: BRAND_PINK,
      });

      page.drawText('Rapport des commandes de plus de 7 jours', {
        x: margin,
        y: y - 40,
        size: 10,
        font: fontItalic,
        color: GRAY,
      });

      const generatedLabel = `Généré le ${formatDate(new Date())}`;
      const genWidth = fontRegular.widthOfTextAtSize(generatedLabel, 9);
      page.drawText(generatedLabel, {
        x: pageWidth - margin - genWidth,
        y: y - 8,
        size: 9,
        font: fontRegular,
        color: GRAY,
      });

      // ligne rose sous l'en-tête
      page.drawLine({
        start: { x: margin, y: y - 50 },
        end: { x: pageWidth - margin, y: y - 50 },
        thickness: 2,
        color: BRAND_PINK,
      });

      y -= 70;
    }

    function drawSummary() {
      const summaryItems = [
        { label: 'Commandes', value: String(orders.length) },
        { label: 'Vêtements', value: String(totals.garments) },
        { label: 'Total facturé', value: formatMoney(totals.total) },
        { label: 'Total encaissé', value: formatMoney(totals.paid) },
        { label: 'Reste à payer', value: formatMoney(totals.remaining) },
      ];
      const boxWidth = tableWidth / summaryItems.length;
      summaryItems.forEach((item, i) => {
        const x = margin + i * boxWidth;
        page.drawRectangle({
          x,
          y: y - 40,
          width: boxWidth - 6,
          height: 40,
          color: LIGHT_GRAY,
        });
        page.drawText(item.label, {
          x: x + 6,
          y: y - 15,
          size: 7.5,
          font: fontRegular,
          color: GRAY,
        });
        page.drawText(item.value, {
          x: x + 6,
          y: y - 30,
          size: 10,
          font: fontBold,
          color: BRAND_DARK,
        });
      });
      y -= 55;
    }

    function drawTableHeader() {
      let x = margin;
      page.drawRectangle({
        x: margin,
        y: y - 18,
        width: tableWidth,
        height: 18,
        color: BRAND_DARK,
      });
      columns.forEach((col) => {
        page.drawText(col.label, {
          x: x + 4,
          y: y - 13,
          size: 8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
        x += col.width;
      });
      y -= 18;
    }

    function ensureSpace(rowHeight: number) {
      if (y - rowHeight < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
        drawTableHeader();
      }
    }

    function truncate(text: string, font: typeof fontRegular, size: number, maxWidth: number): string {
      if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
      let result = text;
      while (result.length > 0 && font.widthOfTextAtSize(result + '…', size) > maxWidth) {
        result = result.slice(0, -1);
      }
      return result + '…';
    }

    drawHeader();
    drawSummary();

    if (orders.length === 0) {
      page.drawText('Aucune commande de plus de 7 jours.', {
        x: margin,
        y: y - 10,
        size: 10,
        font: fontItalic,
        color: GRAY,
      });
    } else {
      drawTableHeader();

      orders.forEach((o, idx) => {
        const rowHeight = 16;
        ensureSpace(rowHeight);

        if (idx % 2 === 1) {
          page.drawRectangle({
            x: margin,
            y: y - rowHeight,
            width: tableWidth,
            height: rowHeight,
            color: rgb(0.98, 0.98, 0.99),
          });
        }

        const values: Record<string, string> = {
          receipt: o.receiptNumber.slice(0, 8),
          client: o.customer.fullName,
          depot: formatDate(o.depositDate),
          prevu: formatDate(o.expectedReturnDate),
          statut: STATUS_LABELS[o.status] || o.status,
          vetements: String(o.garments.length),
          total: formatMoney(o.totalPrice),
          paye: formatMoney(o.paidAmount),
          reste: formatMoney(o.remainingAmount),
        };

        let x = margin;
        columns.forEach((col) => {
          const raw = values[col.key] ?? '';
          const text = truncate(raw, fontRegular, 7.5, col.width - 8);
          const isRemaining = col.key === 'reste' && o.remainingAmount > 0;
          page.drawText(text, {
            x: x + 4,
            y: y - rowHeight + 5,
            size: 7.5,
            font: fontRegular,
            color: isRemaining ? BRAND_PINK : BRAND_DARK,
          });
          x += col.width;
        });

        page.drawLine({
          start: { x: margin, y: y - rowHeight },
          end: { x: margin + tableWidth, y: y - rowHeight },
          thickness: 0.5,
          color: LIGHT_GRAY,
        });

        y -= rowHeight;
      });
    }

    // Pied de page sur toutes les pages
    const pages = pdfDoc.getPages();
    pages.forEach((p, i) => {
      p.drawText(`MN Pressing — Page ${i + 1}/${pages.length}`, {
        x: margin,
        y: margin - 20,
        size: 7,
        font: fontRegular,
        color: GRAY,
      });
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="mn-pressing-commandes-7jours-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Orders export PDF error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
