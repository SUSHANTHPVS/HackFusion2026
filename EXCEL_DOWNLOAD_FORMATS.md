# Excel Download Formats Documentation

## Overview
Three Excel file download options have been added to the **Registrations and Presence** section in the Admin Panel. Each format serves a different purpose and provides different data views of your registered teams and participants.

---

## Format 1: Complete Team Information (Emerald Green Button)
**File Name:** `hackfusion-team-information.xlsx`

### Purpose
Complete team registration data with all participant details and payment proof information.

### Columns Included
| Column | Description |
|--------|-------------|
| S.No | Serial number for each team |
| Team Name | Official team name |
| Problem Statement (Theme) | Theme track selected by the team |
| Participant Names | All participant names (comma-separated) |
| Roll Numbers | Roll numbers of all participants (comma-separated) |
| Email IDs | Email addresses of all participants (comma-separated) |
| Branches | Branch/Department of all participants (comma-separated) |
| Sections | Section/Division of all participants (comma-separated) |
| College Name | Name of the college/institution |
| Payment Method | Payment method used (ONLINE, MANUAL_BANK_TRANSFER, CHEQUE, etc.) |
| Payment Proof | Actual payment proof screenshot file path (e.g., `uploads/payment-proofs/team-123.jpg`) or "Online Payment" |
| Payment Status | Status of the payment (success, failed, pending_verification) |
| Amount (₹) | Payment amount in Indian Rupees |
| Order ID | Razorpay Order ID or internal reference |
| UTR / Transaction ID | UTR number for bank transfers or transaction ID |

### Payment Proof Information
The **Payment Proof** column now includes:
- **Online Payments:** Shows "Online Payment" (Razorpay processed)
- **Manual Bank Transfers/Cheques:** Shows the actual file path to the uploaded screenshot
  - Example: `uploads/payment-proofs/team-12345-proof.jpg`
  - Example: `uploads/payment-proofs/team-67890-proof.png`

To view the actual payment screenshot:
1. Take the file path from the Excel column (e.g., `uploads/payment-proofs/team-123.jpg`)
2. Construct the full URL: `https://your-domain.com/uploads/payment-proofs/team-123.jpg`
3. OR access through the admin dashboard's payment verification page

### Best For
- Complete registration records with payment verification
- Payment proof tracking and verification
- Email communication campaigns
- Payment reconciliation and auditing
- College-wise analysis with payment details
- Theme-wise team distribution with payment status

---

## Format 2: Simple Participant List (Purple Button)
**File Name:** `hackfusion-participants-list.xlsx`

### Purpose
A simple, clean list of individual participants with basic information.

### Columns Included
| Column | Description |
|--------|-------------|
| Name | Participant name |
| Roll Number | Roll number |
| Branch | Branch/Department |
| Section | Section/Division |

### Best For
- Quick participant list
- ID verification on event day
- Attendance marking sheet
- Simple data validation
- Print-friendly format

---

## Format 3: Summary Statistics (Orange Button)
**File Name:** `hackfusion-summary-statistics.xlsx`

### Content
A summary sheet with key metrics:

1. **Total Teams** - Total number of registered teams
2. **Total Participants** - Total number of registered participants
3. **Theme-wise Breakdown** - For each theme track:
   - Number of teams
   - Number of participants

### Best For
- Executive summaries
- Event statistics
- Theme popularity analysis
- Quick overview reports
- Planning and resource allocation

### Example Output
```
Metric | Value | Details
-------|-------|--------
Total Teams | 25 | 
Total Participants | 85 |
[Blank Row] | |
Theme-wise Breakdown | |
Multi-Robot Task Negotiation Engine | 3 team(s) | 10 participants
Semantic SLAM Recovery & Map Reconstruction | 2 team(s) | 7 participants
Physics-Informed Drone Digital Twin | 4 team(s) | 14 participants
... | ... | ...
```

---

## How to Use

### Step 1: Navigate to Admin Panel
- Go to the Admin Dashboard
- Click on "Registrations and Presence" section

### Step 2: Optional - Apply Filters
- Use the search bar to filter teams/participants if needed
- Click "Apply Search" to filter data

### Step 3: Download Excel Format
- Click on the desired download button:
  - **Format 1 (Complete)** - for detailed information
  - **Format 2 (Simple)** - for participant list
  - **Format 3 (Summary)** - for statistics

### Step 4: Use the Excel File
- The file will download to your default downloads folder
- Open with Microsoft Excel, Google Sheets, or any spreadsheet application
- You can now analyze, print, or share the data

---

## Technical Details

### Data Source
All downloads use data from **paid registrations only** (Payment Status = Success)

### File Format
- Format: `.xlsx` (Excel Workbook)
- Encoding: UTF-8
- Sheets: 1 sheet per file

### Timestamps
Exported at the time of download. Files reflect the current registration status only.

### Missing Data Handling
- Empty or missing fields are displayed as "N/A"
- Comma-separated values (CSV) are used when combining multiple fields
- "Online Payment" is shown for teams with online payment (no proof file)

---

## Common Use Cases

### Use Case 1: Email Communication
1. Download **Format 1** (Complete)
2. Use the "Email IDs" column for bulk email campaigns
3. Personalize emails using "Participant Names" and "Team Name"

### Use Case 2: Attendance Marking
1. Download **Format 2** (Simple)
2. Print the sheet on event day
3. Use it as a checklist while scanning QR codes or manually marking attendance

### Use Case 3: Event Planning Report
1. Download **Format 3** (Summary)
2. Include in your event report
3. Share with organizers and sponsors

### Use Case 4: Payment Verification
1. Download **Format 1** (Complete)
2. Cross-check "Payment Proof" column
3. Verify all teams have submitted valid payment proof

### Use Case 5: Team Statistics
1. Download **Format 3** (Summary)
2. Analyze theme-wise participation
3. Identify most popular problem statements

---

## Features

✅ **Real-time Data** - Downloads always reflect the latest registration status  
✅ **Automatic Formatting** - Excel files are pre-formatted for easy reading  
✅ **Multiple Sheets** - Each file has a labeled sheet  
✅ **No Data Loss** - All information is preserved in Excel format  
✅ **Fast Download** - Instant file generation and download  
✅ **No Server Upload** - Direct browser download (client-side processing)  

---

## Troubleshooting

### File Won't Download
- Check browser pop-up blockers
- Ensure cookies are enabled
- Try a different browser

### Missing Data in File
- Verify participants have completed registration
- Ensure payment has been marked as "success"
- Check that all required fields were filled during registration

### Column Headers Not Clear
- Check that "Format 2" for the simplest format
- Use "Format 1" for the most detailed information

---

## Notes

- Downloads are based on **paid registrations only**
- To include all registrations (pending or failed), contact your system administrator
- Use the "Refresh" button to ensure you have the latest data before downloading
- Files are generated on-the-fly with no server storage required

---

**Last Updated:** 2026-09-23  
**Component:** [AdminRegistrationsPage.jsx](../client/src/pages/AdminRegistrationsPage.jsx)
