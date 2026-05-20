# ToyKart Activity Diagram (Revised)

This version is aligned with the current codebase and removes unsupported wording like advanced user-side product filtering controls.

## Main Activities (15, Step-by-Step)

1. Register account or login (Customer)
2. Browse product collection (Customer)
3. Search products by keyword or category route (Customer)
4. View product details (Customer)
5. Add/update/remove cart items (Customer)
6. Proceed to checkout (Customer)
7. Enter shipping details and select available district/city (Customer)
8. Review totals and place order (Customer)
9. Complete payment (SSLCommerz) or keep COD pending (Customer/System/Gateway)
10. View my orders and order action center (Customer)
11. Cancel order or request return/refund (Customer)
12. Login to admin panel (Admin)
13. Manage catalog and shipping data (categories, products, image upload, shipping countries/districts) (Admin)
14. Manage customer orders (status, notes, cancel, refund, tracking fields) (Admin)
15. Review and decide return requests (approve/reject/update status) (Admin)

## PlantUML Code

```plantuml
@startuml

title ToyKart - End-to-End Activity Flow (Customer + Admin)

|Customer|
start
if (Has account?) then (yes)
  :Login;
else (no)
  :Register;
  :Login;
endif

:Browse collection;
:Search by keyword/category;
:Open product details;
:Add/update cart items;

if (Proceed to checkout?) then (yes)
  :Open checkout;
else (no)
  stop
endif

:Enter shipping and contact info;
|System|
:Validate shipping country/district;
if (Shipping location available?) then (yes)
  :Calculate shipping and total;
else (no)
  |Customer|
  :Update shipping location;
  |System|
  :Re-validate location;
endif

|Customer|
:Place order;
|System|
:Create order record (pending);

|Customer|
if (Payment method = SSLCommerz?) then (yes)
  |System|
  :Initialize SSLCommerz session;
  |Gateway|
  :Process transaction;
  if (Payment success?) then (yes)
    |System|
    :Mark order paid;
  else (no)
    |System|
    :Keep order unpaid;
  endif
else (no - COD)
  |System|
  :Keep payment pending (COD);
endif

|Customer|
:View My Orders;
:Open Order Action Center;
if (Need cancel?) then (yes)
  :Submit cancel request;
  |System|
  :Apply cancellation if eligible;
endif

|Customer|
if (Need return/refund?) then (yes)
  :Submit return/refund request;
  |System|
  :Create return request ticket;
endif

|Admin|
:Login to admin panel;
:Manage categories/products/images;
:Manage shipping countries/districts;
:Manage orders (status/notes/cancel/refund/tracking);
:Review return requests and approve/reject;

|System|
:Persist updates and notify customer;

stop
@enduml
```

