# Bank Details Collection for Razorpay - Implementation Guide

## Overview

Bank details (account number, IFSC code, account holder name, etc.) are now collected from participants during the hackathon registration process. This enables:

1. **Refund Processing**: Admin can process refunds directly to participant bank accounts
2. **Payment Verification**: Additional verification layer for payment security
3. **Compliance**: Required for some Indian banking regulations

## Feature Implementation

### Database Changes

**Modified Collections:**
- `User`: Added `bankDetails` subdocument for individual user bank information
- `Team`: Added `bankDetails` subdocument for team-level refund processing
- `Payment`: Added `bankDetails` subdocument to link payment with bank details

**Bank Details Schema:**
```javascript
bankDetails: {
  accountHolder: String,      // 3-100 characters, alphanumeric with spaces/hyphens/periods
  accountNumber: String,      // 9-18 digits (Indian bank account format)
  ifscCode: String,          // 11 characters (AAAA0BBBBBB format)
  bankName: String,          // 2-100 characters
  accountType: String,       // "savings" or "current"
}
```

### API Changes

#### Registration Endpoint
**Route**: `POST /register/team`

**New Request Body**:
```javascript
{
  teamName: "...",
  teamLeaderName: "...",
  rollNo: "...",
  // ... other fields
  bankDetails: {
    accountHolder: "JOHN DOE",
    accountNumber: "123456789012",
    ifscCode: "SBIN0001234",
    bankName: "State Bank of India",
    accountType: "savings"
  }
}
```

**Validation Rules**:
- Bank details are **optional** at submission level
- If ANY bank detail field is provided, BOTH `accountNumber` AND `ifscCode` are **required**
- IFSC format: 11 characters - 4 letters + "0" + 6 alphanumeric characters (e.g., `SBIN0001234`)
- Account number: 9-18 digits
- Account holder: 3-100 characters, letters/spaces/hyphens/periods only
- Account type: "savings" or "current"

#### Admin Search Registrations
**Route**: `GET /admin/registrations/search`

**Response Update**:
Now includes bank details in the response:
```javascript
{
  teamId: "...",
  teamName: "...",
  // ... other fields
  bankDetails: {...},         // Payment-linked bank details
  teamBankDetails: {...}      // Team-level bank details
}
```

### Frontend Components

#### 1. BankDetailsForm Component
**Location**: `client/src/components/BankDetailsForm.jsx`

**Usage**:
```jsx
import { BankDetailsForm } from "../components/BankDetailsForm";

<BankDetailsForm 
  formData={formData}           // { bankDetails: {...} }
  onChange={setFormData}        // State setter
  errors={errors}               // { bankDetails: "..." }
/>
```

**Features**:
- Expandable/collapsible accordion UI
- Auto-formatting: IFSC converts to uppercase
- Input validation feedback
- Help tooltips on complex fields (account number, IFSC code)
- Privacy notice for user reassurance
- Field status indicator ("✓ Provided" when complete)

#### 2. BankDetailsDisplay Component
**Location**: `client/src/components/BankDetailsDisplay.jsx`

**Usage**:
```jsx
import { BankDetailsDisplay } from "../components/BankDetailsDisplay";

<BankDetailsDisplay 
  bankDetails={paymentData.bankDetails}
  showFullDetails={true}        // For admin view
/>
```

**Features**:
- Displays bank information in a formatted card
- Account number masking for security (shows last 4 digits only)
- IFSC code formatting
- Security notice for users
- Highlights importance for refund processing

### Validation Utilities

#### Server-side (`server/utils/bankValidation.js`)
```javascript
export const validateIFSCCode(ifscCode)        // Validates IFSC format
export const validateAccountNumber(accountNumber)  // Validates account number
export const validateAccountHolder(accountHolder)  // Validates name format
export const validateBankName(bankName)        // Validates bank name
export const validateAndSanitizeBankDetails(bankDetails)  // Full validation
export const maskAccountNumber(accountNumber)  // Returns ****XXXX
export const formatIFSCCode(ifscCode)         // Returns uppercase IFSC
```

#### Client-side (`client/src/utils/bankValidation.js`)
```javascript
export const maskAccountNumber(accountNumber)  // Mask for display
export const formatIFSCCode(ifscCode)         // Format for display
export const hasBankDetails(bankDetails)      // Check if details exist
```

## User Flow

### Registration Page
1. User fills out team and participant details
2. User encounters **"Bank Details"** section (expandable)
3. User can optionally expand and fill:
   - Account Holder Name
   - Account Number (9-18 digits)
   - IFSC Code (11 characters)
   - Bank Name
   - Account Type (savings/current)
4. Tooltips provide guidance on where to find each field
5. Form validates on submit:
   - If no bank details provided → registration proceeds
   - If partial bank details → error: "Both account number and IFSC required"
   - If complete bank details → registration proceeds

### Admin Panel
1. Admin navigates to **"Registrations"** or **"Payments"** page
2. Admin searches for a team or clicks on a team
3. Team details modal opens
4. Modal shows:
   - **Payment Information** section with Order ID and Payment ID
   - **Bank Details for Refund** section with:
     - Account Holder name (full text)
     - Account Number (masked as ****XXXX)
     - IFSC Code
     - Bank Name
     - Account Type
5. Admin can use this information to process refunds

## Security Considerations

### Data Protection
- Account numbers are masked in frontend display (show only last 4 digits)
- Full details available only in admin panel (protected by authentication)
- Bank details transmitted over HTTPS only
- Stored encrypted in MongoDB (recommend field-level encryption for production)

### Validation
- All inputs validated on both client and server
- IFSC codes follow Indian banking standards
- Account numbers validated for proper digit count
- Name validation prevents injection attacks

### Privacy
- Privacy notice displayed in the bank details form
- Data used only for refund processing
- Clear user consent through form submission

## Error Handling

### Frontend Validation Errors
- "Account number must be 9-18 digits"
- "IFSC code must be 11 characters (format: AAAA0BBBBBB)"
- "Account holder name must be 3-100 characters"
- "Both account number and IFSC code are required"

### Server Validation Errors
Same validation occurs server-side for security.

## Testing Checklist

- [ ] Test registration with bank details provided
- [ ] Test registration without bank details (should work)
- [ ] Test registration with partial bank details (should fail)
- [ ] Test IFSC format validation (e.g., "SBIN0001234", "HDFC0001234")
- [ ] Test account number validation (9-18 digits)
- [ ] Test account holder name validation (letters/spaces/hyphens/periods)
- [ ] Test admin view shows masked account numbers
- [ ] Test admin can see full bank details in registration modal
- [ ] Test bank details appear in payment records
- [ ] Test export includes bank details (if applicable)
- [ ] Test mobile responsiveness of bank details form
- [ ] Test form submission with various IFSC codes
- [ ] Test form submission with various account numbers

## Integration Points

### Frontend Pages
- `HackathonRegistrationPage.jsx`: Form submission includes `bankDetails` payload
- `AdminRegistrationsPage.jsx`: Modal displays `BankDetailsDisplay` component
- `AdminPaymentsPage.jsx`: Can be enhanced to show bank details (future)

### Backend Routes
- `registrationRoutes.js`: Validation schema includes `bankDetailsSchema`
- `adminRoutes.js`: `searchRegistrations` includes bank details in response

### Backend Controllers
- `registrationController.js`: Saves `bankDetails` to `Team` and `Payment` documents
- `adminController.js`: Returns `bankDetails` in team search results

## Future Enhancements

1. **Automated Refund Processing**: API to process refunds via Razorpay to bank accounts
2. **Bank Verification**: Real-time bank account validation using NEFT/IMPS
3. **Audit Trail**: Log all bank details access and modifications
4. **Field-level Encryption**: Encrypt sensitive bank fields in database
5. **Compliance Reports**: Generate reports for financial audit/compliance
6. **Bulk Export**: Export bank details for bulk refund processing
7. **Email Notifications**: Notify admin when refund is processed
8. **User Dashboard**: Allow users to update bank details after registration

## Troubleshooting

### Bank Details Not Saving
- Check that both `accountNumber` and `ifscCode` are provided
- Verify IFSC format is correct (11 characters)
- Check server logs for validation errors

### Admin Cannot See Bank Details
- Verify team has payment with status "success"
- Check that payment record has `bankDetails` field populated
- Ensure admin is logged in with "admin" role

### Validation Errors
- Account number: Must be numeric only, 9-18 digits
- IFSC: Must be format like "SBIN0001234" (4 letters + 0 + 6 characters)
- Account holder: Letters, spaces, hyphens, periods only
- Bank name: 2-100 characters

## Support

For questions or issues regarding bank details implementation:
1. Check the validation utilities in `server/utils/bankValidation.js`
2. Review the schema definitions in `models/User.js`, `models/Team.js`, `models/Payment.js`
3. Check browser console for client-side errors
4. Check server logs for server-side validation errors
5. Refer to the integration points listed above
