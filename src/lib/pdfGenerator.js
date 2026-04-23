import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Coordinate mapping - adjust these for accurate placement
export const COORDS = {
  name: { x: 116, y: 723 },
  dates: { x: 100, y: 660 },
  note: { x: 26, y: 598, maxWidth: 570, lineHeight: 10 },
  catTahunan: { x: 266, y: 661 },
  catBesar: { x: 563, y: 661 },
  catSakit: { x: 266, y: 647 },
  catMelahirkan: { x: 563, y: 647 },
  catPenting: { x: 266, y: 634 },
  catLuarTanggungan: { x: 563, y: 634 }
}

/**
 * Client-side function to fetch the template, modify it with data, and return a Blob.
 */
export async function generateLeavePDF({ name, category, dates, note, customCoords }) {
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

  // Draw checkmark "V" for selected category
  const catKey = category ? `cat${category}` : null;
  if (catKey && currentCoords[catKey]) {
    firstPage.drawText('V', { x: currentCoords[catKey].x, y: currentCoords[catKey].y, ...drawOpts })
  }

  // Format dates 
  let datesStr = ''
  if (dates && dates.length > 0) {
    if (dates.length === 1) {
      datesStr = `1 day selected`
    } else {
      datesStr = `${dates.length} days selected`
    }
  }
  if (currentCoords.dates) firstPage.drawText(datesStr, { x: currentCoords.dates.x, y: currentCoords.dates.y, ...drawOpts })

  if (note && currentCoords.note) {
    firstPage.drawText(note, {
      x: currentCoords.note.x,
      y: currentCoords.note.y,
      maxWidth: currentCoords.note.maxWidth || 500,
      lineHeight: currentCoords.note.lineHeight || 14,
      ...drawOpts
    })
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
