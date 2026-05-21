# Customer email notifications

Emails go to the **order owner’s account email** only (not admin).

## When we DO email

### Orders
| Event | Email |
|--------|--------|
| Order placed | Order confirmed |
| Online payment success | Payment received |
| Online payment failed | Payment not completed |
| Order **shipped** | Order update |
| Order **delivered** | Order update |
| Order cancelled | Order cancelled |
| Refund issued (admin / SSL) | Refund processed |
| Refund failed (gateway) | Refund issue |

### Returns
| Event | Email |
|--------|--------|
| Return requested | Return received |
| Admin needs more info | Return update |
| Refund approved | Return update (with amount) |
| Return / refund rejected | Return update |
| Return completed / refund sent | Refund processed (one email) |
| Replacement shipped | Return update (with tracking) |

## When we do NOT email

- Confirmed / processing status changes  
- Payment cancelled (user left checkout)  
- Cancellation “approved” only (refund email comes later)  
- Pickup scheduled, picked up, inspection, under review, etc.  
- Every admin chat message (use **Need more info** for important asks)  
- Replacement delivered (shipped email is enough)  

## Files

- `server/src/utils/notifyUserEmail.js`
