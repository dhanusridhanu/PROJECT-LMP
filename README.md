# Local Artisan / Handicraft Marketplace

An affordable online storefront connecting local craftspeople and artisans directly with conscious buyers.

## Tech Stack
- **Frontend**: React.js (Vite)
- **Backend**: Node.js & Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **File Uploads**: Multer (Local storage)

## Roles & Core Features
- **Buyer**: Browse authentic handicrafts, filter by category, search, shopping cart, checkout, order tracking (`PLACED` -> `SHIPPED` -> `DELIVERED`).
- **Seller (Artisan)**: Register shop profile, await admin approval, add/manage products & variants, upload images, manage inventory, update order status for their sold items.
- **Admin**: Approve/reject artisans, oversee product catalog & categories, monitor platform health.

## Project Structure
```
PROJECT-LMP/
├── client/          # Frontend React Application
├── server/          # Backend Node.js / Express API
├── README.md
└── .gitignore
```
