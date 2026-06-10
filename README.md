# Essbyebay Platform

A comprehensive admin-managed eCommerce platform built with Next.js, MongoDB, and Tailwind CSS. This platform allows admins to manage products and sellers, while sellers can pick products from a global catalog and earn commissions.

## 🚀 Features

### Admin Features
- **Product Management**: Create, edit, and manage products in the global catalog
- **Seller Verification**: Review and verify seller accounts with ID verification
- **Order Management**: Place orders on behalf of buyers and track order status
- **Wallet Management**: Handle seller wallet top-ups and withdrawal requests
- **Dashboard Analytics**: View comprehensive platform statistics

### Seller Features
- **Product Selection**: Pick products from the global catalog for their store
- **Order Management**: View orders with masked customer information
- **Wallet System**: Track earnings, request top-ups, and manage withdrawals
- **Store Dashboard**: Monitor performance and manage store operations

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js
- **UI Components**: Lucide React, Headless UI
- **Forms**: React Hook Form, Zod validation
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd my-app
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/taha-ecom
```

### 3. Database Setup

Run the setup script to create the admin user and sample data:

```bash
npm run setup
```

This will create:
- Admin user: `admin@essbyebay.com` / `admin123`
- Sample products in the global catalog

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 👥 User Roles & Access

### Admin Access
- **URL**: `/admin/dashboard`
- **Login**: `admin@essbyebay.com` / `admin123`
- **Features**: Full platform management

### Seller Access
- **URL**: `/seller/dashboard`
- **Registration**: `/auth/signup`
- **Login**: `/auth/signin`
- **Features**: Product selection, order management, wallet

## 📁 Project Structure

```
my-app/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── seller/            # Seller dashboard pages
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utility functions
├── models/                # MongoDB models
├── types/                 # TypeScript definitions
└── scripts/               # Setup and utility scripts
```

## 🔧 Key Components

### Database Models
- **User**: Admin and seller accounts with role-based access
- **Product**: Global product catalog managed by admin
- **SellerProduct**: Products selected by sellers
- **Order**: Order management with status tracking
- **Wallet**: Seller financial management
- **WalletTransaction**: Transaction history and requests

### Authentication Flow
1. **Admin Login**: Direct access to admin dashboard
2. **Seller Registration**: Email, password, store name, ID upload
3. **Seller Verification**: Admin reviews and approves/rejects
4. **Seller Login**: Access granted only after verification

### Business Rules
- ✅ Only admins can create and manage products
- ✅ Sellers pick products from global catalog (no editing)
- ✅ Fixed commission system per order
- ✅ Admin manages all order placement and tracking
- ✅ Masked customer information for sellers
- ✅ Wallet system for financial management

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion integration
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Loading States**: Proper loading indicators
- **Toast Notifications**: User feedback for actions
- **Role-based Navigation**: Different interfaces for admin/seller

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: NextAuth.js with JWT
- **Role-based Access**: Strict role verification
- **Input Validation**: Zod schema validation
- **API Protection**: Server-side session verification

## 📊 Dashboard Features

### Admin Dashboard
- Platform statistics overview
- Quick action buttons for management
- Recent activity feed
- Navigation to detailed management pages

### Seller Dashboard
- Store performance metrics
- Recent orders with masked customer info
- Wallet balance and pending amounts
- Quick access to product management

## 🚀 Deployment

### Environment Variables for Production
```env
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.com
MONGODB_URI=your-production-mongodb-uri
```

### Build and Deploy
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Create an issue in the repository

---

**Built with ❤️ using Next.js, MongoDB, and Tailwind CSS**
# Git identity updated to USMAN/usman11801@gmail.com
