const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const drawBox = (doc, x, y, width, height, title) => {
    // Background for header
    doc.fillColor('#f8f9fa').rect(x, y, width, 20).fill();
    doc.rect(x, y, width, height).strokeColor('#333333').stroke();

    // Title
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(title.toUpperCase(), x + 5, y + 5);

    // Reset
    doc.fillColor('#000000').font('Helvetica').fontSize(9);
    return y + 25; // Return content start Y
};

const generateWaybill = (shipment, res) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    // Pipe to response
    doc.pipe(res);

    // ================= HEADER =================
    // Logo
    const logoJPG = path.join(__dirname, '../assets/logo.jpg');
    const logoPNG = path.join(__dirname, '../assets/logo.png');

    let hasLogo = false;
    if (fs.existsSync(logoJPG)) {
        doc.image(logoJPG, 30, 30, { width: 120 });
        hasLogo = true;
    } else if (fs.existsSync(logoPNG)) {
        doc.image(logoPNG, 30, 30, { width: 120 });
        hasLogo = true;
    }

    // Waybill Title & Barcode Placeholder
    const headerX = hasLogo ? 180 : 30;

    doc.fontSize(24).font('Helvetica-Bold').text('WAYBILL', 400, 35, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Ref: ${shipment.shipmentId}`, 400, 65, { align: 'right' });
    doc.text(`Date: ${new Date(shipment.createdAt).toISOString().split('T')[0]}`, 400, 80, { align: 'right' });

    doc.moveDown(4);

    // ================= SENDER & RECEIVER ROW ================= [Y ~ 120]
    const boxY = 120;
    const boxHeight = 110;
    const boxWidth = 260;

    // Sender Box
    let contentY = drawBox(doc, 30, boxY, boxWidth, boxHeight, 'Sender Details');
    if (shipment.senderDetails) {
        doc.text(shipment.senderDetails.fullName || '', 40, contentY);
        doc.font('Helvetica-Bold').text(shipment.senderDetails.company || '', 40, contentY + 12);
        doc.font('Helvetica').text(shipment.senderDetails.mobile || '', 40, contentY + 24);
        doc.text(shipment.senderDetails.email || '', 40, contentY + 36);

        const addr = shipment.senderDetails.address;
        doc.text(`${addr.street || ''}`, 40, contentY + 50);
        doc.text(`${addr.suburb || ''}, ${addr.city || ''}`, 40, contentY + 62);
        doc.text(`${addr.province || ''}, ${addr.postalCode || ''}`, 40, contentY + 74);
    } else {
        doc.text(shipment.senderName || 'N/A', 40, contentY);
        doc.text(shipment.senderPhone || '', 40, contentY + 12);
    }

    // Receiver Box
    contentY = drawBox(doc, 305, boxY, boxWidth, boxHeight, 'Receiver Details');
    if (shipment.deliveryDetails) {
        doc.text(shipment.deliveryDetails.receiverName || '', 315, contentY);
        doc.font('Helvetica-Bold').text(shipment.deliveryDetails.company || '', 315, contentY + 12);
        doc.font('Helvetica').text(shipment.deliveryDetails.mobile || '', 315, contentY + 24);
        doc.text(shipment.deliveryDetails.email || '', 315, contentY + 36);

        const addr = shipment.deliveryDetails.address;
        doc.text(`${addr.street || ''}`, 315, contentY + 50);
        doc.text(`${addr.suburb || ''}, ${addr.city || ''}`, 315, contentY + 62);
        doc.text(`${addr.province || ''}, ${addr.postalCode || ''}`, 315, contentY + 74);
    } else {
        doc.text(shipment.receiverName || 'N/A', 315, contentY);
        doc.text(shipment.receiverPhone || '', 315, contentY + 12);
    }

    // ================= SHIPMENT DETAILS ROW ================= [Y ~ 250]
    const detailsY = 250;
    const detailsHeight = 100;

    // Service & Parcel Info
    contentY = drawBox(doc, 30, detailsY, 170, detailsHeight, 'Service Info');

    if (shipment.parcelDetails) {
        doc.text('Service:', 40, contentY);
        doc.font('Helvetica-Bold').text(shipment.parcelDetails.serviceType.toUpperCase(), 90, contentY);

        doc.font('Helvetica').text('Type:', 40, contentY + 15);
        doc.text(shipment.parcelDetails.parcelType, 90, contentY + 15);

        if (shipment.parcelDetails.dimensions) {
            doc.text('Weight:', 40, contentY + 30);
            doc.text(`${shipment.parcelDetails.dimensions.weight} kg`, 90, contentY + 30);

            doc.text('Dims:', 40, contentY + 45);
            const { length, width, height } = shipment.parcelDetails.dimensions;
            doc.text(`${length}x${width}x${height} cm`, 90, contentY + 45);
        }
    } else {
        doc.text('Type:', 40, contentY);
        doc.text(shipment.packageType, 90, contentY);
        doc.text('Weight:', 40, contentY + 15);
        doc.text(shipment.parcelWeight + ' kg', 90, contentY + 15);
    }

    // Instructions Box
    contentY = drawBox(doc, 210, detailsY, 170, detailsHeight, 'Instructions');
    if (shipment.parcelDetails && shipment.parcelDetails.specialInstructions) {
        doc.text(shipment.parcelDetails.specialInstructions, 220, contentY, { width: 150, height: 70 });
    } else {
        doc.text('None', 220, contentY);
    }

    // Payment Box
    contentY = drawBox(doc, 390, detailsY, 175, detailsHeight, 'Payment Info');
    if (shipment.payment) {
        doc.text('Method:', 400, contentY);
        doc.font('Helvetica-Bold').text(shipment.payment.method.toUpperCase(), 460, contentY);

        doc.font('Helvetica').text('Status:', 400, contentY + 15);
        doc.text(shipment.payment.status.toUpperCase(), 460, contentY + 15);
    } else {
        // Fallback or legacy handling - empty for now to hide cost
    }

    // ================= SIGNATURES ================= [Y ~ 550]
    const sigY = 550;
    const tableWidth = 535; // Full width (595 - 30 - 30)
    const colWidth = tableWidth / 2;
    const headerHeight = 20;
    const nameRowHeight = 25;
    const sigAreaHeight = 80;
    const totalHeight = headerHeight + nameRowHeight + sigAreaHeight;

    // Draw Outer Box
    doc.rect(30, sigY, tableWidth, totalHeight).stroke();

    // Vertical Divider (Middle)
    doc.moveTo(30 + colWidth, sigY).lineTo(30 + colWidth, sigY + totalHeight).stroke();

    // Horizontal Line 1 (Below Header)
    doc.moveTo(30, sigY + headerHeight).lineTo(30 + tableWidth, sigY + headerHeight).stroke();

    // Horizontal Line 2 (Below Name)
    doc.moveTo(30, sigY + headerHeight + nameRowHeight).lineTo(30 + tableWidth, sigY + headerHeight + nameRowHeight).stroke();

    // TEXT CONTENT

    // Headers
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
    doc.text('SENDER SIGNATURE', 35, sigY + 6);
    doc.text('RECEIVER SIGNATURE', 30 + colWidth + 5, sigY + 6);

    // Name Labels & Lines
    doc.fontSize(10).font('Helvetica');
    doc.text('NAME:', 35, sigY + headerHeight + 8);
    doc.text('NAME:', 30 + colWidth + 5, sigY + headerHeight + 8);

    // Name Underlines (Optional, but looks good with label)
    // doc.moveTo(35 + 40, sigY + headerHeight + 18).lineTo(35 + colWidth - 10, sigY + headerHeight + 18).stroke(); 
    // doc.moveTo(30 + colWidth + 5 + 40, sigY + headerHeight + 18).lineTo(30 + colWidth + colWidth - 10, sigY + headerHeight + 18).stroke();

    // Footer
    doc.fontSize(7).text('ShipDay Courier Services | Terms & Conditions Apply', 30, 750, { align: 'center', color: '#888888' });

    doc.end();
};

const generatePOD = (shipment, res) => {
    const doc = new PDFDocument();
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SHIPDAY WAYBILL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Waybill No: ${shipment.shipmentId}`, { align: 'right' });
    doc.moveDown();

    // Basic Info
    doc.fontSize(12).text(`Date Shipped: ${new Date(shipment.createdAt).toLocaleDateString()}`);
    doc.text(`From: ${shipment.senderName || (shipment.senderDetails ? shipment.senderDetails.fullName : '')}`);
    doc.text(`To: ${shipment.receiverName || (shipment.deliveryDetails ? shipment.deliveryDetails.receiverName : '')}`);
    doc.moveDown();

    // Content
    doc.text('Received in good order and condition:');
    doc.moveDown(2);

    // Signature Block
    const sigY = 400;
    doc.moveTo(50, sigY).lineTo(250, sigY).stroke();
    doc.text('Receiver Signature', 50, sigY + 10);

    doc.moveTo(300, sigY).lineTo(500, sigY).stroke();
    doc.text('Date & Time', 300, sigY + 10);

    doc.end();
};

module.exports = {
    generateWaybill,
    generatePOD
};
