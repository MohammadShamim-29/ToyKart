# ToyKart Report Notes

This file is the central place for all newly generated report content.
Each new item should be added as a new section using the template below.

---

## Section Template

### [Section Title]
**Date:** YYYY-MM-DD  
**Topic:** Short topic name

[Write the generated content here.]

---

## Introduction

ToyKart is a full-stack MERN e-commerce platform developed to demonstrate how a modern online store can be designed, implemented, and managed through a complete end-to-end workflow. The system combines a customer-facing storefront and an administrator control panel, covering the full commerce cycle from user registration and product discovery to checkout, order tracking, and post-purchase return handling. Built with React (Vite) on the frontend and Node.js/Express with MongoDB on the backend, the project emphasizes both usability and operational control through secure JWT-based authentication, role-based access, and modular REST APIs.

From the customer perspective, ToyKart supports account creation and login, category-based browsing, keyword search, detailed product viewing, cart management, shipping location selection, order placement, payment flow integration (including SSLCommerz/COD handling), and personal order history with cancellation/return request options. From the admin perspective, the platform provides centralized tools to manage categories, products, image uploads, shipping countries and districts, customer records, order lifecycle states (status, notes, cancel/refund actions), and return-request decisions. This dual-interface design reflects real-world e-commerce requirements where customer experience and back-office efficiency must work together.

In addition to implementation, the report documents the system through UML use-case and activity modeling, ER/Chen data modeling, and stepwise database normalization (UNF to 1NF, 2NF, and 3NF). These artifacts show how ToyKart was engineered with structured analysis and normalized data design to reduce redundancy, preserve consistency, and maintain scalability. Overall, ToyKart represents a practical, academically grounded, and industry-relevant e-commerce solution prototype.

### 1.2 Background of the Study

The growth of digital commerce has transformed how customers discover, evaluate, and purchase products. As online shopping continues to expand, businesses increasingly depend on e-commerce platforms that are secure, scalable, and easy to manage. However, many systems still face common limitations such as inconsistent product organization, weak order tracking, limited return/refund workflows, and poor integration between customer-facing features and administrative operations.

To address these challenges, this study focuses on the design and development of a complete e-commerce management system, ToyKart, that supports both user and administrator needs in a unified platform. The system includes core functionalities such as user authentication, product browsing, category-based organization, shopping cart and checkout processes, shipping location handling, order lifecycle management, and return request processing. In parallel, an administrative panel enables structured control over products, categories, shipping settings, orders, returns, and customer data.

This study is also grounded in systematic software engineering and database design principles. The system is modeled through use case and activity analysis, and the database structure is refined using normalization steps from UNF to 3NF to improve consistency, reduce redundancy, and ensure data integrity. Therefore, the background of this study lies in both practical e-commerce requirements and the need for a methodical approach to building reliable information systems.

### 1.3 Methodology

This study followed a practical system development methodology that combines requirement analysis, system design, implementation, testing, and documentation. The ToyKart platform was developed iteratively using the MERN stack, where each module (authentication, product management, cart, checkout, order lifecycle, and return workflow) was implemented and verified step by step. To complete this practicum work and prepare this report, two types of data sources were used, as described below.

### 1.2 Methodology

There are two types of data sources are used to complete this practicum work and develop this report. These are explained below:

### 1.2.1 Primary Sources

The steps of primary sources are given below:

- Direct observation of project requirements and user needs during system planning.
- Hands-on development of frontend and backend modules in the ToyKart project.
- Practical implementation of database models, API routes, controllers, and admin resources.
- Testing system features through real execution of key workflows (registration, login, browsing, checkout, order management, and return requests).
- Verification and refinement of outputs through debugging and iterative improvements.
- Preparation of UML and normalization artifacts based on actual implemented system behavior.

Additional points:

- Primary source data ensured that the report reflects real development activities, not only theoretical assumptions.
- This source type helped validate functionality, usability, and data consistency directly from the working system.

### 1.2.2 Secondary Sources

The steps of secondary sources are given below:

- Review of official documentation for React, Node.js, Express, MongoDB, Mongoose, and related libraries.
- Study of software engineering references for requirement analysis, system design, and testing practices.
- Consultation of academic materials on ER modeling, UML diagrams, and database normalization (UNF, 1NF, 2NF, 3NF).
- Reference to e-commerce workflow standards for order lifecycle and return/refund management.
- Use of existing project notes and technical resources to structure report writing and explanation.

Additional points:

- Secondary sources provided conceptual and technical guidance to support implementation decisions.
- This source type strengthened the academic quality of the report by linking practical work with established theory and standards.

### 1.3 Objectives

A clear set of objectives was defined to guide the development and evaluation of the ToyKart e-commerce system. These objectives are divided into broad and specific objectives, as presented below.

### 1.3.1 Broad Objective

The broad objective of this study is to design and develop a complete, reliable, and user-friendly e-commerce management system that supports end-to-end online shopping operations and effective administrative control.

### 1.3.2 Specific Objectives

- To develop a secure user authentication system for customer and admin access.
- To implement product, category, and catalog browsing features for improved product discovery.
- To build cart, checkout, shipping selection, and order placement workflows for customers.
- To implement order lifecycle and return request management for both users and administrators.
- To design a normalized database structure and supporting system models to ensure data integrity and maintainability.

### 1.4 Process Model

The process model utilized to develop the ToyKart system is the **Iterative Incremental Model**.
In this approach, the project was developed in small, manageable increments, where each increment delivered a functional module of the system. Instead of building the entire application in a single cycle, the development progressed through repeated phases of planning, design, implementation, testing, and improvement.

For this project, modules such as authentication, product and category management, cart and checkout, order lifecycle handling, return request workflow, and admin operations were built and refined step by step. This model allowed continuous validation of features and made it easier to adjust requirements based on practical findings during development.

Reasons for choosing this process model are given below:

- It supports gradual development of complex systems through smaller functional parts.
- It allows early delivery of working modules for testing and feedback.
- It reduces project risk by identifying and fixing issues in each iteration.
- It provides flexibility to improve or modify features during development.
- It is suitable for full-stack projects where frontend, backend, and database components evolve together.
- It improves quality through repeated testing and refinement in every increment.

### 1.5 Feasibility Study

A feasibility study was conducted to evaluate whether the proposed ToyKart system can be successfully developed and implemented in a practical environment. The analysis confirms that the system is feasible from technical, economic, and operational perspectives. The proposed system is feasible in all these three phases as discussed below.

### 1.5.1 Technical Feasibility

The project is technically feasible because it is built using widely adopted and well-supported technologies: React (Vite) for frontend development, Node.js and Express for backend services, and MongoDB with Mongoose for database management. These technologies are compatible, scalable, and suitable for e-commerce applications. The system architecture supports modular development, secure authentication, role-based access, and REST API integration. Required development tools, libraries, and documentation are readily available, which reduces technical risk and supports stable implementation.

### 1.5.2 Economic Feasibility

The project is economically feasible because it uses mostly open-source technologies and tools, which significantly lowers software licensing costs. Development can be performed with existing computing resources and standard internet access, without requiring expensive infrastructure in the initial phase. Maintenance and future upgrades are also cost-effective due to the large ecosystem and community support for the selected technology stack. Therefore, the overall development and deployment cost remains reasonable compared to the expected functional value of the system.

### 1.5.3 Operational Feasibility

The project is operationally feasible because the system is designed around practical user and admin workflows. Customers can perform common operations such as registration, product browsing, cart management, checkout, and order tracking with minimal complexity. Administrators can manage products, categories, shipping regions, orders, and return requests through a centralized panel. The process flow aligns with real e-commerce operations, and the interface structure supports day-to-day usability. As a result, the system can be effectively operated in a real organizational setting.

### Chapter 6.

### Project Planning and Scheduling

### 6.1 System Project Estimation

The accuracy of software project estimation depends on the following factors:

- Proper estimation of software size.
- Correct conversion of size into effort and schedule.
- Team capability and familiarity with the technology stack.
- Stability of requirements and development environment.
- Scope control based on deadline and resource constraints.

For this project, Function Point Analysis (FPA) is used for size and effort estimation.

### 6.2 Function-Oriented Metrics

1. External Inputs  
Table 8: External Input Table and Complexity

| Function | Type | Complexity | FP (Low=3, Avg=4, High=6) |
|---|---|---|---:|
| Register Account | EI | Average | 4 |
| Customer Login | EI | Low | 3 |
| Admin Login | EI | Low | 3 |
| Add to Cart | EI | Average | 4 |
| Update Cart Quantity | EI | Average | 4 |
| Remove Cart Item | EI | Low | 3 |
| Place Order | EI | High | 6 |
| Submit Return Request | EI | Average | 4 |
| Create Product (Admin) | EI | Average | 4 |
| Update Order Status (Admin) | EI | Average | 4 |
| Update User Profile | EI | Low | 3 |
| Subtotal (EI) |  |  | 42 FP |

2. External Output  
Table 9: External Output Table and Complexity

| Function | Type | Complexity | FP (Low=4, Avg=5, High=7) |
|---|---|---|---:|
| Checkout Price Summary | EO | Average | 5 |
| Admin Order Summary | EO | Average | 5 |
| Invoice/Receipt Output | EO | Low | 4 |
| Subtotal (EO) |  |  | 14 FP |

3. External Inquiries  
Table 10: External Inquiry Table and Complexity

| Function | Type | Complexity | FP (Low=3, Avg=4, High=6) |
|---|---|---|---:|
| Browse Products | EQ | Low | 3 |
| View Product Details | EQ | Low | 3 |
| View Categories | EQ | Low | 3 |
| View Shipping Locations | EQ | Low | 3 |
| Search Products | EQ | Average | 4 |
| View My Orders | EQ | Average | 4 |
| Order Tracking Timeline | EQ | High | 6 |
| Subtotal (EQ) |  |  | 26 FP |

4. Internal Logical Files (ILF)  
Table 11: Internal Logical Files

| Function | Type | Complexity | FP (Low=7, Avg=10, High=15) |
|---|---|---|---:|
| User Data | ILF | Low | 7 |
| Product and Category Data | ILF | Low | 7 |
| Order and Return Data | ILF | Low | 7 |
| Subtotal (ILF) |  |  | 21 FP |

5. External Interface Files (EIF)  
Table 12: External Interface Files

| Function | Type | Complexity | FP (Low=5, Avg=7, High=10) |
|---|---|---|---:|
| SSLCommerz Payment Interface | EIF | Low | 5 |
| Subtotal (EIF) |  |  | 5 FP |

### 6.3 Identifying Complexity

#### 6.3.1 Identifying Complexity of Transition Function
Table 13: Transaction Complexity Distribution

| Transaction Type | Low | Average | High | Total |
|---|---:|---:|---:|---:|
| EI | 4 | 6 | 1 | 11 |
| EO | 1 | 2 | 0 | 3 |
| EQ | 4 | 2 | 1 | 7 |

#### 6.3.2 Identifying Complexity of Data Function
Table 14: Data Complexity Distribution

| Data Type | Low | Average | High | Total |
|---|---:|---:|---:|---:|
| ILF | 3 | 0 | 0 | 3 |
| EIF | 1 | 0 | 0 | 1 |

#### 6.3.3 Unadjusted Function Point Contribution (Transaction Function)
Table 15: Transaction UFP Contribution

| Component | Calculation | UFP |
|---|---|---:|
| EI | (4x3) + (6x4) + (1x6) | 42 |
| EO | (1x4) + (2x5) + (0x7) | 14 |
| EQ | (4x3) + (2x4) + (1x6) | 26 |
| Total Transaction UFP |  | 82 |

#### 6.3.4 Unadjusted Function Point Contribution (Data Function)
Table 16: Data UFP Contribution

| Component | Calculation | UFP |
|---|---|---:|
| ILF | (3x7) + (0x10) + (0x15) | 21 |
| EIF | (1x5) + (0x7) + (0x10) | 5 |
| Total Data UFP |  | 26 |

#### 6.3.5 Performance and Environmental Impact
Table 17: Value Adjustment Factor (VAF) Table

| No | General System Characteristic (GSC) | Degree of Influence (0-5) |
|---:|---|---:|
| 1 | Data Communications | 3 |
| 2 | Distributed Data Processing | 2 |
| 3 | Performance | 3 |
| 4 | Heavily Used Configuration | 2 |
| 5 | Transaction Rate | 3 |
| 6 | Online Data Entry | 3 |
| 7 | End-User Efficiency | 3 |
| 8 | Online Update | 3 |
| 9 | Complex Processing | 2 |
| 10 | Reusability | 3 |
| 11 | Installation Ease | 2 |
| 12 | Operational Ease | 3 |
| 13 | Multiple Sites | 1 |
| 14 | Facilitate Change | 2 |
|  | Total Degree of Influence (TDI) | 35 |

VAF = 0.65 + (0.01 x TDI) = 0.65 + (0.01 x 35) = 1.00

#### 6.3.6 Counting Adjusted Function Point
Table 18: Unadjusted Function Point Count

| Component | Total FP |
|---|---:|
| EI | 42 |
| EO | 14 |
| EQ | 26 |
| ILF | 21 |
| EIF | 5 |
| Total (UFP) | 108 FP |

AFP = UFP x VAF = 108 x 1.00 = 108 FP

Effort Calculation (Updated Constraint: 3 Persons, 3 Months)

Assumptions:

- Team size = 3 persons
- Target duration = 3 months
- Working days per month = 24
- Working hours per day = 8
- Productivity factor = 16 person-hours/FP

Effort (person-hours) = AFP x Productivity = 108 x 16 = 1728 person-hours  
Person-days = 1728 / 8 = 216 person-days  
Work per person = 216 / 3 = 72 days  
Project duration = 72 / 24 = 3 months

---

## CEP and CEA Table (ToyKart)

### CEP/CEA Coverage for Practicum Report
**Date:** 2026-05-13  
**Topic:** Complex Engineering Problem (CEP) and Complex Engineering Activities (CEA) Mapping

### Project Information

| Field | Details |
|---|---|
| Course Code and Title | CSC 490, Practicum |
| Title of the Practicum | ToyKart: A Full-Stack E-commerce Management Platform |
| Student Name | [Your Name] |
| Student ID | [Your ID] |
| Supervisor Name | [Supervisor Name] |

### Complex Engineering Problems (CEP)

| Name of CEP | Addressed (Explain How?) or Not Addressed |
|---|---|
| P1: Depth of Knowledge Required | **Addressed.** The project required applied knowledge of React, Node.js, Express, MongoDB/Mongoose, JWT authentication, role-based access control, REST API architecture, and database normalization (UNF to 3NF). |
| P2: Range of Conflicting Requirements | **Addressed.** The system balances customer usability (fast browsing, easy checkout) with admin control (inventory, order lifecycle, return decisions), while also handling data integrity and performance constraints. |
| P3: Depth of Analysis Required | **Addressed.** Analysis was needed for order lifecycle rules, stock updates, return-request constraints, and relation consistency across users, orders, products, shipping, and returns. |
| P4: Familiarity of Issues | **Addressed.** Core web development issues were familiar, but integrating full e-commerce workflows (admin + customer + return management) required broader system-level design and debugging. |
| P5: Extent of Applicable Codes | **Addressed.** Secure authentication flow, validation checks, route protection, and data consistency rules were implemented according to standard software engineering and backend security practices. |
| P6: Stakeholder Involvement and Needs | **Addressed.** Multiple stakeholder needs were considered: customers (shopping and order tracking), admins (product/order/return control), and maintainers (structured schema and modular code). |
| P7: Interdependence | **Addressed.** Major modules are interdependent: product stock changes on order placement, shipping validation affects checkout, and returns depend on order/user state and admin workflow. |

### Complex Engineering Activities (CEA)

| Name of CEA | Addressed (Explain How?) or Not Addressed |
|---|---|
| A1: Range of Resources | **Addressed.** The project used React (Vite), Node.js, Express, MongoDB, Mongoose, JWT, Redux Toolkit, React Admin, and PlantUML for modeling/documentation. |
| A2: Level of Interaction | **Addressed.** The system involves interaction among customer UI, admin panel, backend APIs, authentication middleware, and database models with role-based authorization. |
| A3: Innovation | **Addressed.** The project combines storefront and operations workflow in one platform, including normalized schema design, admin lifecycle tooling, and integrated return-request processing. |
| A4: Consequences to Society and Environment | **Addressed.** The system improves digital commerce accessibility and process transparency (orders, returns, records), reducing manual paperwork and improving operational efficiency. |
| A5: Familiarity | **Addressed.** While MERN components are familiar, designing full order/return lifecycle logic with consistent state transitions required significant advanced practical work beyond basic coursework. |

### Comments

ToyKart demonstrates a complete software engineering workflow: requirement analysis, UI/backend implementation, relational data design, normalization, and operational/admin process control. The project satisfies CEP and CEA criteria through technical depth, module interdependence, and real-world e-commerce problem solving.

