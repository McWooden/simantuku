import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Coordinate mapping - adjust these for accurate placement
export const COORDS = {
  name: { x: 116, y: 723 },
  nip: { x: 454, y: 723 },
  position: { x: 116, y: 710 },
  unit: { x: 117, y: 697 },
  phone: { x: 460, y: 420 },
  address: { x: 28, y: 420 },
  daysCount: { x: 79, y: 547 },
  startDate: { x: 317, y: 547 },
  endDate: { x: 478, y: 547 },
  note: { x: 26, y: 598, maxWidth: 570, lineHeight: 10 },
  catTahunan: { x: 266, y: 661 },
  catBesar: { x: 563, y: 661 },
  catSakit: { x: 266, y: 647 },
  catMelahirkan: { x: 563, y: 647 },
  catPenting: { x: 266, y: 634 },
  catLuarTanggungan: { x: 563, y: 634 },
  sisaN: { x: 118, y: 455 },
  sisaN1: { x: 118, y: 469 },
  sisaN2: { x: 118, y: 482 }
}

/**
 * Client-side function to fetch the template, modify it with data, and return a Blob.
 */
export async function generateLeavePDF({ name, nip, position, unit, phone, address, category, dates, note, quotas, customCoords }) {
  const currentCoords = customCoords || COORDS;

  // Fetch the template from public folder
  const res = await fetch('/templates/Template_Cuti.pdf')
  if (!res.ok) {
    throw new Error('Template PDF could not be found. Please ensure public/templates/Template_Cuti.pdf exists.')
  }
  const existingPdfBytes = await res.arrayBuffer()

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes)

  // Embed the Times New Roman font
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

  // Get the first page of the document
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]

  // Default drawing options
  const drawOpts = { size: 11, font: timesRomanFont, color: rgb(0, 0, 0) }

  // Draw values at specific coordinates
  if (currentCoords.name) firstPage.drawText(name || '', { x: currentCoords.name.x, y: currentCoords.name.y, ...drawOpts })
  if (nip && currentCoords.nip) firstPage.drawText(nip || '', { x: currentCoords.nip.x, y: currentCoords.nip.y, ...drawOpts })
  if (position && currentCoords.position) firstPage.drawText(position || '', { x: currentCoords.position.x, y: currentCoords.position.y, ...drawOpts })
  if (unit && currentCoords.unit) firstPage.drawText(unit || '', { x: currentCoords.unit.x, y: currentCoords.unit.y, ...drawOpts })
  if (address && currentCoords.address) firstPage.drawText(address || '', { x: currentCoords.address.x, y: currentCoords.address.y, ...drawOpts })

  // Centered fields
  if (phone && currentCoords.phone) {
    const textWidth = timesRomanFont.widthOfTextAtSize(phone, drawOpts.size)
    firstPage.drawText(phone, { ...drawOpts, x: currentCoords.phone.x - textWidth / 2, y: currentCoords.phone.y })
  }

  // Draw checkmark "V" for selected category
  const catKey = category ? `cat${category}` : null;
  if (catKey && currentCoords[catKey]) {
    firstPage.drawText('V', { x: currentCoords[catKey].x, y: currentCoords[catKey].y, ...drawOpts })
  }

  // Format dates 
  if (dates && dates.length > 0) {
    // Robustly parse and sort dates whether they are string 'YYYY-MM-DD' or React Date objects
    const sortedDates = [...dates]
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime())

    const countText = `${sortedDates.length} hari`

    if (currentCoords.daysCount) {
      firstPage.drawText(countText, { x: currentCoords.daysCount.x, y: currentCoords.daysCount.y, ...drawOpts })
    }

    if (currentCoords.startDate) {
      const startText = format(sortedDates[0], 'd MMMM yyyy', { locale: id })
      firstPage.drawText(startText, { x: currentCoords.startDate.x, y: currentCoords.startDate.y, ...drawOpts })
    }

    if (currentCoords.endDate) {
      const endText = format(sortedDates[sortedDates.length - 1], 'd MMMM yyyy', { locale: id })
      firstPage.drawText(endText, { x: currentCoords.endDate.x, y: currentCoords.endDate.y, ...drawOpts })
    }
  }

  if (note && currentCoords.note) {
    firstPage.drawText(note, {
      x: currentCoords.note.x,
      y: currentCoords.note.y,
      maxWidth: currentCoords.note.maxWidth || 500,
      lineHeight: currentCoords.note.lineHeight || 14,
      ...drawOpts
    })
  }

  // Draw Quotas
  if (quotas) {
    const drawCentered = (text, coord) => {
      const textWidth = timesRomanFont.widthOfTextAtSize(text, drawOpts.size)
      firstPage.drawText(text, { ...drawOpts, x: coord.x - textWidth / 2, y: coord.y })
    }

    if (quotas.sisaN !== undefined && currentCoords.sisaN) {
      drawCentered(String(quotas.sisaN), currentCoords.sisaN)
    }
    if (quotas.sisaN1 !== undefined && currentCoords.sisaN1) {
      drawCentered(String(quotas.sisaN1), currentCoords.sisaN1)
    }
    if (quotas.sisaN2 !== undefined && currentCoords.sisaN2) {
      drawCentered(String(quotas.sisaN2), currentCoords.sisaN2)
    }
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save()

  return new Blob([pdfBytes], { type: 'application/pdf' })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
