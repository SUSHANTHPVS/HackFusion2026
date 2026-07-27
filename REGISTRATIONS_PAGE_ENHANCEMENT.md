/**
 * ADMIN REGISTRATIONS PAGE - ENHANCED WITH FULL PARTICIPANT DETAILS
 * 
 * File: client/src/pages/AdminRegistrationsPage.jsx
 * 
 * CHANGES MADE:
 * ============================================================================
 * 
 * 1. NEW COMPONENT: ParticipantDetailModal
 *    - Shows comprehensive participant information in a modal
 *    - Displays payment information
 *    - Shows team leader details (name, email, mobile, roll no, year, branch, section)
 *    - Lists all team members with their details
 *    - Shows payment/order IDs
 *    - Includes "Mark Present" button within the modal
 *    
 * 2. UPDATED COMPONENT: RegistrationCard (Mobile View)
 *    - Added "View Details" button to see full information
 *    - Made "Mark Present" button more compact
 *    
 * 3. ENHANCED TABLE ROW (Desktop View)
 *    - Clickable rows that open the detail modal
 *    - Hover effect to indicate interactivity
 *    - Click handler to display full participant information
 *    
 * 4. UPDATED STATE MANAGEMENT
 *    - Added selectedItem state to track which team is being viewed
 *    - Modal closes after successful presence marking
 *    - selectedItem cleared on close
 *    
 * ============================================================================
 * 
 * PARTICIPANT DETAILS SHOWN TO ADMIN:
 * 
 * Payment & Participation Information:
 * - Payment Status (success)
 * - Payment Amount (₹)
 * - Participation Type (team/individual)
 * - Theme Track
 * 
 * Team Leader Information:
 * - Full Name
 * - Email Address
 * - Mobile Number
 * - Roll Number
 * - Year
 * - Branch
 * - Section
 * - Current Presence Status (Present/Pending)
 * 
 * Team Members Information:
 * - Name of each member
 * - Roll Number
 * - Year
 * - Branch
 * - Section
 * 
 * Payment Details:
 * - Order ID
 * - Payment ID
 * 
 * ============================================================================
 * 
 * USER INTERACTION FLOW:
 * 
 * MOBILE VIEW:
 * 1. Admin sees list of teams (minimal preview)
 * 2. Click "View Details" button
 * 3. Modal opens showing ALL participant details
 * 4. Admin reviews all information
 * 5. Click "Mark Present" button in modal
 * 6. Confirmation message shows
 * 7. Modal closes, list refreshes
 * 
 * DESKTOP VIEW:
 * 1. Admin sees table of teams
 * 2. Click anywhere on the row (except Action button)
 * 3. Modal opens showing ALL participant details
 * 4. Admin reviews all information
 * 5. Click "Mark Present" button in modal
 * 6. Confirmation message shows
 * 7. Modal closes, list refreshes
 * 
 * DIRECT MARKING (Both Views):
 * 1. Click "Mark Present" button directly
 * 2. Bypasses detail modal
 * 3. Marks presence immediately
 * 4. List refreshes
 * 
 * ============================================================================
 * 
 * STYLING & UX IMPROVEMENTS:
 * 
 * Modal Features:
 * - Responsive design (works on mobile and desktop)
 * - Scrollable content area (max height 70vh)
 * - Color-coded sections:
 *   * Gray: Payment & Participation Info
 *   * Blue: Team Leader Details
 *   * Purple: Team Members
 *   * Emerald: Payment IDs
 * - Clear header with close button
 * - Footer with "Close" and "Mark Present" buttons
 * 
 * Table Row Interactions:
 * - Hover effect shows gray background
 * - Cursor changes to pointer
 * - Click handler opens modal with full details
 * - Action button click is isolated (doesn't trigger modal)
 * 
 * Mobile Card:
 * - "View Details" button for modal access
 * - Compact "Mark" button for quick action
 * - Both options available
 * 
 * ============================================================================
 * 
 * DATA FLOW:
 * 
 * Backend returns for each team:
 * {
 *   teamId: ObjectId,
 *   teamName: String,
 *   participationType: String,
 *   themeTrack: String,
 *   teamLeaderName: String,
 *   rollNo: String,
 *   year: String,
 *   branch: String,
 *   section: String,
 *   teammates: [
 *     { name, rollNo, year, branch, section },
 *     ...
 *   ],
 *   accountName: String,
 *   leaderId: ObjectId,
 *   accountEmail: String,
 *   accountMobile: String,
 *   checkedIn: Boolean,
 *   paymentStatus: String,
 *   participationConfirmed: Boolean,
 *   paymentAmountInr: Number,
 *   paymentCurrency: String,
 *   orderId: String,
 *   paymentId: String,
 *   paymentUpdatedAt: Date,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * 
 * All fields are displayed in the modal.
 * 
 * ============================================================================
 * 
 * SECURITY & COMPLIANCE:
 * 
 * ✅ Payment Verification:
 * - Only teams with paymentStatus="success" appear
 * - Payment info displayed for verification
 * - Order and Payment IDs shown for audit trail
 * 
 * ✅ Presence Marking:
 * - Only available for teams with verified payments
 * - Button disabled if payment not successful
 * - All attempts logged to backend
 * 
 * ✅ Data Visibility:
 * - Admin can see all participant information
 * - Complete team composition visible
 * - Contact details (email, mobile) displayed
 * - Educational details (roll no, year, branch) shown
 * 
 * ============================================================================
 * 
 * IMPROVEMENTS OVER PREVIOUS VERSION:
 * 
 * BEFORE:
 * - Only showed: Team name, Leader name, Email, Payment status
 * - No team member information visible
 * - No payment amount or order details
 * - No educational details (branch, section, year, roll no)
 * - No contact information (mobile)
 * - Limited context before marking present
 * 
 * AFTER:
 * - Shows complete team information
 * - All team members listed with details
 * - Payment information visible
 * - All educational details shown
 * - Contact information displayed
 * - Modal provides comprehensive review before action
 * - Professional, organized presentation
 * - Better audit trail (all info visible)
 * 
 * ============================================================================
 */
