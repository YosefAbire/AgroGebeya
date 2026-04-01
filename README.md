# AgroGebeya - Agricultural Retail Management Platform

A modern, full-stack application for AgroGebeya, Ethiopia's agricultural retail marketplace connecting farmers and retailers directly.

## 🎯 Quick Start

### Automated Setup (Windows PowerShell)

**Start Backend:**
```powershell
.\start-backend.ps1
```

**Start Frontend (New Terminal):**
```powershell
.\start-frontend.ps1
```

### Manual Setup

See **[COMPLETE_SETUP.md](COMPLETE_SETUP.md)** for detailed instructions.

## 📂 Project Structure

This project is organized into two main directories:

- **`frontend/`** - Next.js application with React UI (Port 3000)
- **`backend/`** - Python FastAPI server (Port 8000)

Each directory has its own README with specific setup instructions.

## 🔑 Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Farmer | `farmer_demo` | *(see .env)* |
| Retailer | `retailer_demo` | *(see .env)* |
| Admin | `admin` | *(see .env)* |

## 🚀 Technology Stack

### Frontend
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- React Hook Form + Zod

### Backend
- Python 3.9+
- FastAPI
- PostgreSQL
- SQLAlchemy (Async ORM)
- Alembic (Migrations)
- JWT Authentication

## 📡 API Integration

The frontend and backend are fully integrated:

- ✅ Authentication (Login/Register)
- ✅ Products CRUD
- ✅ Orders Management
- ✅ User Management
- ✅ Role-based Access Control

See **[FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)** for details.

## 🗄️ Database

**PostgreSQL Configuration:**
- Database: `agrogebeya`
- User: `postgres`
- Password: *(set in your `.env` file — never commit real credentials)*
- Port: `5432`

**Initialize Database:**
```powershell
cd backend
python init_db.py
```

This creates tables and populates test data (users and products).

## 📚 Documentation

- **[COMPLETE_SETUP.md](COMPLETE_SETUP.md)** - Complete setup guide
- **[FRONTEND_BACKEND_INTEGRATION.md](FRONTEND_BACKEND_INTEGRATION.md)** - API integration details
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide
- **[backend/README.md](backend/README.md)** - Backend documentation
- **[frontend/README.md](frontend/README.md)** - Frontend documentation

## 🌾 Overview

AgroGebeya is a digital platform designed to revolutionize Ethiopia's agricultural retail sector by:
- Connecting farmers directly with retailers
- Reducing intermediaries and transaction costs
- Providing transparent pricing and real-time market information
- Supporting multilingual interfaces (English/Amharic) for diverse users
- Offering offline capabilities through PWA technology

## 🎨 Design System

### Color Palette
- **Primary**: Teal/Green (`oklch(0.42 0.23 142)`) - Trust, growth, agriculture
- **Accent**: Warm Orange (`oklch(0.57 0.19 55)`) - Energy, action
- **Secondary**: Light Neutral (`oklch(0.97 0.01 110)`) - Clean, professional
- **Foreground/Background**: High contrast for accessibility
- **Status Colors**: Green (success), Yellow (warning), Red (error), Blue (info)

### Typography
- **Font Family**: Geist (sans-serif) - Modern, accessible, professional
- **Headings**: Bold, 1.2-1.4 line height for clarity
- **Body**: 14-16px, 1.5-1.6 line height for readability

### Layout
- **Mobile-First**: Optimized for smartphones (2G/3G/4G networks)
- **Responsive**: Seamless experience from 320px to 2560px+
- **Flexbox-Primary**: Used for most layouts with CSS Grid for complex 2D layouts

## 📁 Project Structure

```
app/
├── page.tsx                 # Landing page with platform overview
├── dashboard/
│   └── page.tsx            # Farmer Dashboard
├── retailer-dashboard/
│   └── page.tsx            # Retailer Dashboard
├── products/
│   ├── page.tsx            # Products Marketplace
│   └── new/
│       └── page.tsx        # Add New Product Form
├── product/
│   └── [id]/
│       └── page.tsx        # Product Details Page
├── orders/
│   └── page.tsx            # Order Management
├── inventory/
│   └── page.tsx            # Inventory Management
├── profile/
│   └── page.tsx            # User Profile & Settings
├── layout.tsx              # Root layout with metadata
└── globals.css             # Global styles and design tokens

components/
├── Header.tsx              # Navigation header with mobile menu
├── StatsCard.tsx           # Reusable statistics card
├── ProductCard.tsx         # Product grid item
└── OrderList.tsx           # Order table component

lib/
└── utils.ts                # Utility functions
```

## 🚀 Key Pages & Features

### 1. **Landing Page** (`/`)
- Platform overview and value proposition
- Features showcase (for farmers and retailers)
- Statistics and testimonials
- Call-to-action sections
- Responsive footer with links

### 2. **Farmer Dashboard** (`/dashboard`)
- Overview of farm operations
- Statistics: Total Products, Pending Orders, Total Earnings, Active Listings
- Recent orders from retailers
- Quick action buttons for common tasks
- Beautiful data visualization with trend indicators

### 3. **Retailer Dashboard** (`/retailer-dashboard`)
- Retailer-specific metrics and overview
- Order history from multiple farmers
- Top ordered products analysis
- Stock alerts and recommendations
- Quick ordering interface

### 4. **Products Marketplace** (`/products`)
- Browse all available products
- Search by product name, category, or location
- Category filtering
- Sorting options (newest, price, availability)
- Product cards with farmer info and availability
- Responsive grid layout

### 5. **Product Details** (`/product/[id]`)
- Detailed product information
- High-quality product images
- Farmer contact information
- Product specifications
- Order form with quantity selector
- Delivery date picker
- Price calculation with total

### 6. **Add Product** (`/products/new`)
- Form for farmers to list products
- Image upload with preview
- Product details input
- Category and unit selection
- Quantity and price management
- Form validation and submission

### 7. **Orders Management** (`/orders`)
- View all orders with filtering
- Status-based organization (Pending, Approved, Delivered, Rejected)
- Search functionality
- Order statistics
- Order details and actions

### 8. **Inventory Management** (`/inventory`)
- Stock level monitoring
- Inventory tracking (available, reserved, sold)
- Low stock alerts
- Product status indicators
- Last update timestamps

### 9. **User Profile** (`/profile`)
- Personal information management
- Farm details and specifications
- Edit mode with save functionality
- Account settings links
- Profile picture and bio

## 🎯 Components

### StatsCard
Displays statistics with icons, values, and trend indicators.
```tsx
<StatsCard
  icon={ShoppingCart}
  label="Pending Orders"
  value="8"
  trend={{ value: 5, isPositive: true }}
  color="accent"
/>
```

### ProductCard
Reusable product display component with image, details, and actions.
```tsx
<ProductCard
  id="1"
  name="Tomatoes"
  category="Vegetables"
  price={25}
  unit="KG"
  available={150}
  location="Addis Ababa"
  farmer="John Doe Farm"
/>
```

### OrderList
Table component for displaying orders with filtering and actions.
```tsx
<OrderList 
  orders={orders} 
  showFarmer={true} 
  showRetailer={true}
/>
```

### Header
Sticky navigation with logo, menu, notifications, and profile dropdown.

## 🎨 UI Features

### Responsive Design
- **Mobile**: Hamburger menu, stacked layouts, optimized touch targets
- **Tablet**: 2-column grids, larger touch areas
- **Desktop**: Full navigation, 3-4 column grids, optimal readability

### Accessibility
- ARIA labels on interactive elements
- Semantic HTML structure
- High contrast color combinations
- Focus indicators for keyboard navigation
- Mobile-first responsive approach

### Interactive Elements
- Smooth transitions and hover effects
- Loading states and spinners
- Form validation and error messages
- Modal dialogs and dropdown menus
- Toast notifications (ready for integration)

### Status Indicators
- Color-coded badges for order status
- Visual progress bars for inventory
- Trend indicators with directional arrows
- Stock availability colors (Green/Yellow/Red)

## 🔌 Integration Points

The UI is designed to work with:

### APIs Required
- **Authentication**: User registration, login, token management
- **Products**: Create, read, update, delete product listings
- **Orders**: Order placement, status updates, tracking
- **Inventory**: Stock level queries and updates
- **Payments**: Payment gateway integration (Chapa)
- **Users**: Profile management, farmer/retailer details

### State Management
- React hooks (useState, useCallback, useEffect)
- Ready for Redux/Zustand integration
- SWR or React Query for data fetching
- Optimistic updates support

## 🌐 Multilingual Support (Ready for Implementation)

The UI structure supports both English and Amharic:
- All text strings can be extracted to i18n files
- Right-to-left (RTL) layout support ready
- Language switcher component template included

## 📱 PWA Ready

The application is structured for Progressive Web App capabilities:
- Service worker integration points
- Offline page structure
- App shell architecture
- Installable manifest ready

## 🎯 User Roles

### Farmer
- List and manage agricultural products
- View and approve orders
- Track earnings
- Manage inventory
- Update pricing

### Retailer
- Browse product marketplace
- Place bulk orders
- Track order status
- Manage purchases
- Compare prices

### Government (Admin)
- Monitor system activity
- Approve transport requests
- Generate reports
- User verification
- Platform statistics

## 🚀 Getting Started

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Create PostgreSQL database and run migrations:
   ```bash
   # Create database in PostgreSQL
   # Then run migrations
   alembic upgrade head
   ```

6. Run development server:
   ```bash
   uvicorn app.main:app --reload
   ```

6. API will be available at [http://localhost:8000](http://localhost:8000)
   - Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Prerequisites

- Node.js 18+ and pnpm (for frontend)
- Python 3.9+ (for backend)
- PostgreSQL 12+ (for database)

For detailed setup instructions, see the README files in each directory.

## 🔄 Next Steps for Integration

1. **Connect Backend APIs**
   - Replace mock data with API calls
   - Implement authentication flow
   - Add error handling and loading states

2. **State Management**
   - Implement global state (Redux/Zustand)
   - Handle user sessions
   - Cache API responses

3. **Enhanced Features**
   - Real-time notifications
   - Chat functionality with farmers
   - Payment processing UI
   - Analytics dashboards

4. **Testing**
   - Unit tests for components
   - Integration tests for user flows
   - E2E testing with Cypress

5. **Performance**
   - Image optimization
   - Code splitting
   - Lazy loading
   - Caching strategy

## 📊 Design Specifications

### Spacing
- Base unit: 4px
- Common: 4px, 8px, 12px, 16px, 24px, 32px, 48px

### Border Radius
- Small: 4px
- Medium: 8px
- Large: 10px (default)
- Extra Large: 14px

### Shadows
- Small: `0 1px 2px rgba(0, 0, 0, 0.05)`
- Medium: `0 4px 6px rgba(0, 0, 0, 0.1)`
- Large: `0 20px 25px rgba(0, 0, 0, 0.15)`

### Typography Scale
- H1: 32-48px, bold
- H2: 24-32px, bold
- H3: 20-24px, semibold
- Body: 14-16px, normal
- Small: 12-13px, normal

## 🎓 Learning Resources

- Next.js: https://nextjs.org/docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev

## 📝 License

This project is part of the AgroGebeya Agricultural Retail Management System.

## 🤝 Support

For issues, questions, or suggestions, please refer to the project documentation and design specifications.

---

**Built with Love for Ethiopian Farmers and Retailers**
