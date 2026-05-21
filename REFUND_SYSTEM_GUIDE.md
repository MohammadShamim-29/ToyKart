# ToyKart Admin-Controlled Refund System - Testing & Integration Guide

## Overview

The refund system has been fully implemented with SSLCOMMERZ Refund API integration. This guide covers:
- System architecture and components
- API endpoints and workflows
- Testing procedures
- Troubleshooting

## System Architecture

### Backend Components

#### 1. **Refund Model** (`server/src/models/Refund.js`)
Stores refund transaction records with the following fields:
- `orderId` - Reference to the order
- `status` - ["pending", "processing", "success", "failed"]
- `refundRefId` - SSLCOMMERZ refund reference ID (format: `REFUND_REF_${UUID}`)
- `refundAmount` - Amount to be refunded
- `sourceType` - ["cancellation", "return"]
- `remarks` - Admin remarks for the refund
- `gatewayResponse` - Full response from SSLCOMMERZ API
- `failureReason` - Error message if refund failed
- `retryCount` - Number of retry attempts
- `maxRetries` - Maximum allowed retries (default: 5)
- `processedAt`, `completedAt` - Timestamps

#### 2. **Refund Utility** (`server/src/utils/sslcommerzRefund.js`)
Handles SSLCOMMERZ API communication:
- `processSSLCommerZRefund()` - Initiates refund request
- `checkRefundStatus()` - Checks refund status from gateway
- `validateRefundEligibility()` - Validates order for refund

Key endpoint: `GET https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php` (with `bank_tran_id`, `refund_trans_id`, `refund_amount`, etc.)

#### 3. **Refund Controller** (`server/src/controllers/refundController.js`)
Implements business logic:
- `processRefund()` - POST `/refunds/process/:orderId`
- `getRefundStatus()` - GET `/refunds/status/:refundRefId`
- `getOrderRefunds()` - GET `/refunds/order/:orderId`
- `retryFailedRefund()` - POST `/refunds/retry/:refundRefId`
- `approveCancellation()` - POST `/refunds/approve-cancellation/:orderId`

#### 4. **Refund Routes** (`server/src/routes/refundRoutes.js`)
All routes require authentication and admin privileges (protected & admin middleware)

#### 5. **Order Model Updates**
New fields added to Order schema:
- `refundStatus` - Current refund status
- `refundRefId` - Reference to refund record
- `bankTranId` - SSLCOMMERZ bank transaction ID (from payment)
- `cancellationApprovedAt` - When admin approved cancellation
- `cancellationApprovedBy` - Admin user who approved cancellation
- `returnApprovedAt` - When admin approved return
- `returnApprovedBy` - Admin user who approved return

### Frontend Components

#### 1. **Refund API Wrapper** (`client/src/api/refundAPI.js`)
Axios-based API client for all refund operations:
```javascript
refundAPI.processRefund(orderId, { remarks, sourceType })
refundAPI.getRefundStatus(refundRefId)
refundAPI.getOrderRefunds(orderId)
refundAPI.retryFailedRefund(refundRefId, { remarks })
refundAPI.approveCancellation(orderId)
```

#### 2. **ProcessRefundButton** (`client/src/admin/components/ProcessRefundButton.jsx`)
React component for processing refunds:
- Shows dialog with refund details
- Validates order eligibility (SSLCommerz + Paid + No successful refund)
- Requires admin remarks
- Shows loading and error states
- Callback on success

#### 3. **RefundStatusChip** (`client/src/admin/components/RefundStatusChip.jsx`)
Displays refund status with:
- Status badge (success/failed/processing/none)
- "Check Status" button to verify gateway status
- Details dialog showing refund information

#### 4. **ApproveCancellationButton** (`client/src/admin/components/ApproveCancellationButton.jsx`)
Allows admin to approve order cancellations:
- Shows cancellation reason
- Confirms inventory restoration
- Sets approval timestamp and admin user

#### 5. **Updated Pages**
- **Cancelled Orders** (`client/src/admin/resources/cancelledOrders.jsx`):
  - Added Transaction ID column (shows bank transaction ID)
  - Added Refund Status column
  - Added refund action buttons

- **Return Requests** (`client/src/admin/resources/returns.jsx`):
  - Added Transaction ID column
  - Added Refund Status column
  - Added refund action buttons

## Environment Variables

Required for SSLCOMMERZ API:
```
SSLCZ_STORE_ID=<your_store_id>
SSLCZ_STORE_PASSWORD=<your_store_password>
SSLCZ_IS_LIVE=false  # Set to true for production
```

## API Workflow

### Refund Processing Workflow

```
1. Admin views Cancelled Orders or Return Requests page
   ↓
2. Admin clicks "Process Refund" button
   ↓
3. Dialog opens showing:
   - Refund amount
   - Transaction ID
   - Remarks input field
   ↓
4. Admin enters remarks and clicks "Confirm Refund"
   ↓
5. POST /api/refunds/process/{orderId} sent with sourceType
   ↓
6. Backend validates order eligibility:
   - Order exists
   - Payment method is SSLCommerz
   - Order is paid
   - No successful refund exists
   ↓
7. Backend calls SSLCOMMERZ refund API
   ↓
8. Refund record created with status "pending"
   ↓
9. Response includes:
   - refundRefId (for tracking)
   - refundAmount
   - status
   ↓
10. Frontend shows success message and refreshes data
   ↓
11. Admin can check refund status anytime via "Check Status" button
```

### Cancellation Approval Workflow

```
1. Admin views Cancelled Orders page
   ↓
2. Clicks "Approve Cancellation" button (if status is "cancelled")
   ↓
3. Dialog confirms cancellation reason
   ↓
4. Admin clicks "Approve"
   ↓
5. POST /api/refunds/approve-cancellation/{orderId}
   ↓
6. Updates order with:
   - cancellationApprovedAt = current timestamp
   - cancellationApprovedBy = admin user ID
   ↓
7. Frontend shows success and refreshes
```

## Testing Procedure

### Prerequisites
1. MongoDB running locally
2. Dev server running: `npm run dev`
3. Admin account with SSL Commerz test credentials
4. Test orders with SSLCommerz payment method

### Step 1: Create Test Order

1. Browse to http://localhost:5173 as customer
2. Add products to cart
3. Checkout with SSLCommerz payment
4. Complete payment using test credentials:
   - Card: 4111111111111111
   - Month: 12, Year: 25
   - CVV: 123

### Step 2: Cancel Order

1. Log in as customer
2. Go to "My Orders"
3. Click order → "Cancel Order"
4. Provide cancellation reason
5. Submit cancellation request

### Step 3: Approve Cancellation (Admin)

1. Log in as admin
2. Navigate to "Cancelled Orders"
3. Find the test order
4. Click "Approve Cancellation" button
5. Confirm in dialog
6. Verify order shows approved status

### Step 4: Process Refund (Admin)

1. In "Cancelled Orders" page
2. Find test order with approved cancellation
3. Click "Process Refund" button
4. Dialog shows:
   - Refund amount (total price)
   - Transaction ID (bankTranId from order)
5. Enter refund remarks: "Test refund - order cancellation"
6. Click "Confirm Refund"
7. Wait for API response
8. Verify success notification appears

### Step 5: Check Refund Status

1. In "Cancelled Orders", find the processed refund row
2. Click "Check Status" button in Refund Status column
3. Dialog opens showing:
   - Status (should be "success", "processing", or "failed")
   - Refund Reference ID
   - Refund Amount
   - Processed/Completed timestamps
   - Any failure reason if applicable

### Step 6: Test Return Request Refund

1. Log in as customer
2. Go to "My Orders" → completed order
3. Click "Request Return"
4. Fill return details and submit
5. Log in as admin
6. Go to "Return Requests"
7. Find test return
8. Click "Process Refund"
9. Enter remarks: "Test refund - product return"
10. Confirm refund
11. Verify success

## API Response Examples

### Successful Refund Processing

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "refundId": "6789abcdef123456",
    "refundRefId": "REFUND_REF_uuid-here",
    "status": "processing",
    "refundAmount": 5000,
    "sourceType": "cancellation",
    "processedAt": "2024-05-21T12:34:56.789Z"
  }
}
```

### Refund Status Check

```json
{
  "success": true,
  "message": "Refund completed",
  "status": "success",
  "data": {
    "refundRefId": "REFUND_REF_uuid-here",
    "status": "success",
    "refundAmount": 5000,
    "completedAt": "2024-05-21T12:35:00.000Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Order not eligible for refund",
  "error": "Order payment method is not SSLCommerz"
}
```

## Error Handling

### Frontend Error Scenarios

1. **Order Not Eligible**
   - Error: "Order not eligible for refund"
   - Cause: Not SSLCommerz, not paid, or already refunded
   - Button: Hidden/disabled

2. **Network Error**
   - Error shown in dialog
   - Retry mechanism available
   - Notification displays error message

3. **Gateway Error**
   - Error shows SSLCOMMERZ response message
   - Refund marked as "failed"
   - Admin can retry via "Retry Failed Refund"

### Retry Mechanism

- Max 5 retry attempts per refund
- Each failed refund tracks retry count
- Admin can manually retry via `/retry/{refundRefId}`
- Retries update the refund record with new gateway response

## Troubleshooting

### Issue: "No Transaction ID"
- **Cause**: Order's `bankTranId` not populated
- **Solution**: Ensure order was paid via SSLCommerz gateway (field set during payment callback)

### Issue: Refund Button Not Showing
- **Cause**: Order doesn't meet eligibility criteria
- **Check**:
  - `paymentMethod === "SSLCommerz"`
  - `isPaid === true`
  - `refundStatus !== "success"`

### Issue: "Not authorized as admin"
- **Cause**: User doesn't have admin privileges
- **Solution**: Log in with admin account or promote user in database

### Issue: SSLCOMMERZ API Error
- **Check**:
  - `SSLCZ_STORE_ID` and `SSLCZ_STORE_PASSWORD` environment variables
  - SSLCOMMERZ account has refund feature enabled
  - Sandbox URL correct for testing
  - Order `bankTranId` matches what gateway has

### Issue: Refund Status Shows "No Refund"
- **Cause**: Refund not created yet or refundRefId is null
- **Solution**:
  - Verify "Process Refund" was clicked successfully
  - Check Order document for `refundRefId`
  - Check Refund collection for record

## Database Queries for Testing

### Find order with refund
```javascript
db.orders.findOne({ 
  refundStatus: { $exists: true, $ne: null } 
})
```

### Find all refunds for an order
```javascript
db.refunds.find({ 
  orderId: ObjectId("...") 
}).pretty()
```

### Check failed refunds (for retry)
```javascript
db.refunds.find({ 
  status: "failed" 
}).pretty()
```

### Reset order refund status
```javascript
db.orders.updateOne(
  { _id: ObjectId("...") },
  { $set: { refundStatus: null, refundRefId: null } }
)
```

## Production Deployment Checklist

- [ ] Set `SSLCZ_IS_LIVE=true` for production credentials
- [ ] Test with real payment transactions
- [ ] Configure email notifications for refund events
- [ ] Set up monitoring/alerts for failed refunds
- [ ] Document refund policies for customer support
- [ ] Train admin users on refund approval process
- [ ] Backup production database before going live
- [ ] Review all refund records for audit trail
- [ ] Test retry mechanism with actual delays
- [ ] Verify bank transaction reconciliation

## Support & Maintenance

### Daily Checks
- Monitor failed refunds in admin panel
- Review pending refunds for processing
- Check for any error patterns

### Weekly Tasks
- Generate refund reports
- Reconcile with bank transactions
- Archive completed refunds

### Monthly Tasks
- Review refund policies
- Analyze refund trends
- Update documentation

## Files Modified/Created

### Backend
- ✅ `/server/src/models/Refund.js` - Refund schema
- ✅ `/server/src/utils/sslcommerzRefund.js` - SSLCOMMERZ integration
- ✅ `/server/src/controllers/refundController.js` - Refund logic
- ✅ `/server/src/routes/refundRoutes.js` - Refund endpoints
- ✅ `/server/src/models/Order.js` - Updated with refund fields
- ✅ `/server/src/app.js` - Registered refund routes

### Frontend
- ✅ `/client/src/api/refundAPI.js` - Refund API client
- ✅ `/client/src/admin/components/ProcessRefundButton.jsx` - Refund button
- ✅ `/client/src/admin/components/RefundStatusChip.jsx` - Status display
- ✅ `/client/src/admin/components/ApproveCancellationButton.jsx` - Approval button
- ✅ `/client/src/admin/resources/cancelledOrders.jsx` - Updated list
- ✅ `/client/src/admin/resources/returns.jsx` - Updated list

## Next Steps

1. **Testing**: Follow the testing procedure above
2. **Integration**: Deploy to staging environment
3. **UAT**: Admin team tests with real orders
4. **Monitoring**: Set up alerts for failed refunds
5. **Documentation**: Provide admin training materials
6. **Go Live**: Deploy to production with backup strategy

---

**Last Updated**: May 21, 2026
**System Status**: ✅ Ready for Testing
