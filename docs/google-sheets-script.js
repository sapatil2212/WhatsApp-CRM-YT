/**
 * WhatsApp CRM — Google Sheets Appointment Logger
 * ================================================
 * Paste this entire script into Google Apps Script (script.google.com),
 * then deploy it as a Web App:
 *
 *   1. Open your Google Sheet → Extensions → Apps Script
 *   2. Paste this script, replacing any existing code
 *   3. Click "Deploy" → "New deployment"
 *   4. Type: "Web app"
 *   5. Execute as: "Me"
 *   6. Who has access: "Anyone"
 *   7. Click "Deploy" and copy the Web App URL (/exec)
 *   8. Paste the URL into your .env.local:
 *        GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_ID/exec
 *
 * The script auto-creates a sheet named "Appointments" with headers
 * on first run. Every new booking appends one row.
 *
 * Columns written:
 *   A  Booked At        (IST timestamp)
 *   B  Appointment ID   (UUID from Supabase)
 *   C  Clinic Name
 *   D  Patient Name
 *   E  Patient Age
 *   F  Patient Phone
 *   G  Reason for Visit
 *   H  Doctor Name
 *   I  Specialization
 *   J  Date             (YYYY-MM-DD)
 *   K  Time             (HH:MM)
 *   L  Status           (always "Scheduled" on creation)
 */

var SHEET_NAME = 'Appointments';

var HEADERS = [
  'Booked At',
  'Appointment ID',
  'Clinic Name',
  'Patient Name',
  'Patient Age',
  'Patient Phone',
  'Reason for Visit',
  'Doctor Name',
  'Specialization',
  'Date',
  'Time',
  'Status',
];

/**
 * Returns (or creates) the Appointments sheet with a styled header row.
 */
function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // Write header row
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // Style header row
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#1a73e8');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);

    // Freeze header row
    sheet.setFrozenRows(1);

    // Set column widths
    sheet.setColumnWidth(1, 160);  // Booked At
    sheet.setColumnWidth(2, 220);  // Appointment ID
    sheet.setColumnWidth(3, 160);  // Clinic Name
    sheet.setColumnWidth(4, 140);  // Patient Name
    sheet.setColumnWidth(5, 80);   // Age
    sheet.setColumnWidth(6, 130);  // Phone
    sheet.setColumnWidth(7, 200);  // Reason
    sheet.setColumnWidth(8, 150);  // Doctor
    sheet.setColumnWidth(9, 140);  // Specialization
    sheet.setColumnWidth(10, 110); // Date
    sheet.setColumnWidth(11, 80);  // Time
    sheet.setColumnWidth(12, 100); // Status
  }

  return sheet;
}

/**
 * Converts an ISO timestamp string to IST (UTC+5:30) formatted string.
 */
function toIST(isoString) {
  if (!isoString) return '';
  var d = new Date(isoString);
  // Add 5h 30m offset
  var istMs = d.getTime() + (5 * 60 + 30) * 60 * 1000;
  var ist = new Date(istMs);

  var pad = function(n) { return n < 10 ? '0' + n : String(n); };
  return (
    ist.getUTCFullYear() + '-' +
    pad(ist.getUTCMonth() + 1) + '-' +
    pad(ist.getUTCDate()) + ' ' +
    pad(ist.getUTCHours()) + ':' +
    pad(ist.getUTCMinutes()) + ':' +
    pad(ist.getUTCSeconds()) +
    ' IST'
  );
}

/**
 * Handles POST requests from the WhatsApp CRM backend.
 * Called automatically by Google Apps Script when the Web App receives a POST.
 */
function doPost(e) {
  try {
    var raw = e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    var sheet = getOrCreateSheet();

    var row = [
      toIST(data.bookedAt || new Date().toISOString()),
      data.appointmentId   || '',
      data.clinicName      || '',
      data.patientName     || '',
      data.patientAge      || '',
      data.patientPhone    || '',
      data.reasonForVisit  || '',
      data.doctorName      || '',
      data.specialization  || '',
      data.date            || '',
      data.time            || '',
      'Scheduled',
    ];

    sheet.appendRow(row);

    // Alternate row banding for readability
    var lastRow = sheet.getLastRow();
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground('#f0f4ff');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests — useful for testing that the Web App is live.
 * Visit the /exec URL in your browser; you should see {"status":"ok"}.
 */
function doGet() {
  var sheet = getOrCreateSheet();
  var lastRow = sheet.getLastRow();
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      sheet: SHEET_NAME,
      totalRows: Math.max(0, lastRow - 1), // exclude header
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
