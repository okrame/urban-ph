const { google } = require('googleapis');
const { defineString } = require("firebase-functions/params");

// Define parameters for Google Sheets credentials
const googleSheetsClientEmail = defineString("GOOGLE_SHEETS_CLIENT_EMAIL");
const googleSheetsPrivateKey = defineString("GOOGLE_SHEETS_PRIVATE_KEY");
const googleSheetsSpreadsheetId = defineString("GOOGLE_SHEETS_SPREADSHEET_ID");

// Initialize Google Sheets API
const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: googleSheetsClientEmail.value(),
      private_key: googleSheetsPrivateKey.value().replace(/\\n/g, '\n'), // Handle newlines
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

// Create or update sheet for event
const createOrUpdateEventSheet = async (eventData, bookingsData) => {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = googleSheetsSpreadsheetId.value();
    
    // Clean event title for sheet name (remove special characters)
    const sheetTitle = eventData.title
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .substring(0, 100) // Limit length
      .trim();

    console.log(`Creating/updating sheet: "${sheetTitle}"`);

    // Check if sheet already exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const existingSheet = spreadsheet.data.sheets.find(
      sheet => sheet.properties.title === sheetTitle
    );

    let sheetId;
    
    if (!existingSheet) {
      // Create new sheet
      console.log(`Creating new sheet: ${sheetTitle}`);
      
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetTitle,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              }
            }
          }]
        }
      });
      
      sheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
    } else {
      // Use existing sheet
      sheetId = existingSheet.properties.sheetId;
      console.log(`Using existing sheet: ${sheetTitle}`);
    }

    // Prepare data for the sheet
    const headers = [
      'Booking Date',
      'Full Name',
      'Email', 
      'Phone',
      'Birth Date',
      'Address',
      'Tax ID',
      'Instagram',
      'Specific Request',
      'Status',
      'Payment Status',
      'Event Date',
      'Event Time',
      'Event Location',
      'Venue Name'
    ];

    // Add event info and headers
    const eventInfoRows = [
      [`Event: ${eventData.title}`],
      [`Date: ${eventData.date} | Time: ${eventData.time}`],
      [`Location: ${eventData.venueName || eventData.location}`],
      [`Total Spots: ${eventData.spots} | Available: ${eventData.spotsLeft || 0}`],
      [], // Empty row
      headers
    ];

    // Add booking data
    const bookingRows = bookingsData.map(booking => [
      booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString() : 'N/A',
      booking.userFullName || booking.displayName || 'N/A',
      booking.email || 'N/A',
      booking.phone || 'N/A',
      booking.birthDate || 'N/A',
      booking.address || 'N/A',
      booking.taxId || 'N/A',
      booking.instagram || 'N/A',
      booking.specificRequest || 'None',
      booking.status || 'confirmed',
      booking.paymentStatus || 'N/A',
      eventData.date,
      eventData.time,
      eventData.location,
      eventData.venueName || ''
    ]);

    const allData = [...eventInfoRows, ...bookingRows];

    // Clear existing data and write new data
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetTitle}!A:Z`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: allData,
      },
    });

    // Format the sheet
    await formatEventSheet(sheets, spreadsheetId, sheetId, headers.length, allData.length);

    console.log(`Sheet "${sheetTitle}" updated successfully with ${bookingRows.length} bookings`);
    
    return {
      success: true,
      sheetTitle,
      bookingsCount: bookingRows.length
    };

  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    throw error;
  }
};

// Format the sheet for better readability
const formatEventSheet = async (sheets, spreadsheetId, sheetId, headerCount, totalRows) => {
  try {
    const requests = [
      // Freeze header row
      {
        updateSheetProperties: {
          properties: {
            sheetId: sheetId,
            gridProperties: {
              frozenRowCount: 6 // Freeze event info + headers
            }
          },
          fields: 'gridProperties.frozenRowCount'
        }
      },
      // Bold event info (first 4 rows)
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 0,
            endRowIndex: 4,
            startColumnIndex: 0,
            endColumnIndex: headerCount
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat.textFormat.bold'
        }
      },
      // Bold and color headers
      {
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 5,
            endRowIndex: 6,
            startColumnIndex: 0,
            endColumnIndex: headerCount
          },
          cell: {
            userEnteredFormat: {
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 }
              },
              backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 }
            }
          },
          fields: 'userEnteredFormat.textFormat.bold,userEnteredFormat.textFormat.foregroundColor,userEnteredFormat.backgroundColor'
        }
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: headerCount
          }
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });

  } catch (error) {
    console.error('Error formatting sheet:', error);
    // Don't throw here, formatting is not critical
  }
};

// Export for Cloud Functions
module.exports = {
  createOrUpdateEventSheet
};