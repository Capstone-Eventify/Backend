const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Generate ticket PDF using PDFKit
const generateTicketPDF = async (ticketData) => {
  try {
    const {
      ticket,
      event,
      attendee,
      ticketTier
    } = ticketData;

    // Create a new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Create a buffer to store the PDF
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise(async (resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);

      try {
        // Generate QR code as buffer
        const qrCodeBuffer = await QRCode.toBuffer(ticket.qrCode, {
          errorCorrectionLevel: 'H',
          type: 'png',
          quality: 0.92,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 200
        });

        // Header with gradient-like effect
        doc.rect(0, 0, doc.page.width, 120)
           .fillAndStroke('#4f46e5', '#4f46e5');

        // Title
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('EVENT TICKET', 50, 40, { align: 'center' });

        doc.fontSize(14)
           .font('Helvetica')
           .text('Admit One', 50, 75, { align: 'center' });

        // Reset color for body content
        doc.fillColor('black');

        let yPosition = 150;

        // Event Title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(event.title, 50, yPosition, { width: 350 });
        
        yPosition += 50;

        // Event Details
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text('DATE & TIME', 50, yPosition);
        
        doc.fontSize(14)
           .font('Helvetica')
           .fillColor('black')
           .text(
             `${new Date(event.startDate).toLocaleDateString('en-US', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
             })}${event.startTime ? ` at ${event.startTime}` : ''}`,
             50, yPosition + 15
           );

        yPosition += 50;

        // Location
        if (event.venueName || event.city) {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .fillColor('#6b7280')
             .text('LOCATION', 50, yPosition);
          
          let locationText = event.venueName || 'Venue TBA';
          if (event.city) {
            locationText += `\n${event.city}${event.state ? `, ${event.state}` : ''}${event.country ? `, ${event.country}` : ''}`;
          }
          
          doc.fontSize(14)
             .font('Helvetica')
             .fillColor('black')
             .text(locationText, 50, yPosition + 15);

          yPosition += 70;
        }

        // Attendee
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text('ATTENDEE', 50, yPosition);
        
        doc.fontSize(14)
           .font('Helvetica')
           .fillColor('black')
           .text(`${attendee.firstName} ${attendee.lastName}`, 50, yPosition + 15);

        yPosition += 50;

        // Ticket Type and Price
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text('TICKET TYPE', 50, yPosition);
        
        const ticketTypeName = ticketTier?.name || 'General Admission';
        const ticketPrice = ticketTier?.price || ticket.price || 0;
        
        doc.fontSize(14)
           .font('Helvetica')
           .fillColor('black')
           .text(`${ticketTypeName} - $${ticketPrice.toFixed(2)}`, 50, yPosition + 15);

        yPosition += 50;

        // Status
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text('STATUS', 50, yPosition);
        
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#059669')
           .text(ticket.status.toUpperCase(), 50, yPosition + 15);

        // QR Code on the right side
        const qrX = 420;
        const qrY = 200;

        // QR Code border
        doc.rect(qrX - 10, qrY - 10, 170, 220)
           .stroke('#e5e7eb');

        // QR Code title
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#6b7280')
           .text('SCAN TO CHECK IN', qrX, qrY - 5, { width: 150, align: 'center' });

        // QR Code image
        doc.image(qrCodeBuffer, qrX + 25, qrY + 15, { width: 100, height: 100 });

        // QR Code instruction
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('Show this QR code at\nthe event entrance', qrX, qrY + 130, { width: 150, align: 'center' });

        // Footer
        const footerY = doc.page.height - 100;
        
        doc.rect(0, footerY - 20, doc.page.width, 120)
           .fillAndStroke('#f9fafb', '#f9fafb');

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#6b7280')
           .text('This ticket is valid for one person only. Please bring a valid ID.', 50, footerY, { align: 'center' });

        doc.text('For support, contact the event organizer.', 50, footerY + 15, { align: 'center' });

        doc.fontSize(8)
           .font('Helvetica')
           .fillColor('#9ca3af')
           .text(`Ticket ID: ${ticket.id}`, 50, footerY + 40, { align: 'center' });

        // Finalize the PDF
        doc.end();

      } catch (error) {
        reject(error);
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};



module.exports = {
  generateTicketPDF
};