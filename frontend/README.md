# AgroGebeya Frontend

Frontend application for the AgroGebeya agricultural marketplace platform built with Next.js.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Run development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                # Next.js app directory
│   ├── admin/         # Admin pages
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard pages
│   ├── inventory/     # Inventory management
│   ├── orders/        # Order management
│   ├── products/      # Product pages
│   └── ...
├── components/        # React components
│   └── ui/           # UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── public/           # Static assets
└── styles/           # Global styles
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
