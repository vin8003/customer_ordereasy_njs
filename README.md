# Shopeasy Customer App (Next.js)

This is the customer-facing web application for the Shopeasy platform, built with **Next.js 14**, **Tailwind CSS**, and **TypeScript**.

## Features

-   **Retailer Selection:** Browse available shops and categories.
-   **Product Browsing:** Grid view with optimized layout and search.
-   **Cart & Checkout:** Seamless cart management and order placement.
-   **User Accounts:** Login/Signup with OTP, address management.
-   **Rewards:** Referral system and loyalty points tracking.
-   **Location:** Integrated Google Maps for precise address selection.

## Prerequisites

-   **Node.js**: v18 or higher
-   **npm**: v9 or higher

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/vin8003/customer_ordereasy_njs.git
cd customer_ordereasy_njs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory. This file is git-ignored to keep your secrets safe.

```bash
cp .env.example .env.local
# Or create it manually
touch .env.local
```

Add the following variables to `.env.local`:

```env
# URL for the Backend API
NEXT_PUBLIC_API_URL=https://api.ordereasy.win/api/

# Google Maps API Key for Location Picker
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

To create an optimized production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## Project Structure

-   `src/app`: App Router pages and layouts.
-   `src/components`: Reusable UI components.
-   `src/services`: API service and HTTP client configuration.
-   `public`: Static assets (images, icons).

## Contributing

1.  Create a feature branch (`git checkout -b feature/amazing-feature`).
2.  Commit your changes (`git commit -m 'Add some amazing feature'`).
3.  Push to the branch (`git push origin feature/amazing-feature`).
4.  Open a Pull Request.
