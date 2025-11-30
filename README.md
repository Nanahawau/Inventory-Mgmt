# Inventory Management System

## Overview

This project is a full-stack inventory management system designed to handle central and branch stores, products, SKUs, inventory, reservations, and stock transfers.  
It consists of a **NestJS backend** (TypeScript) and a **Next.js frontend** (React + TailwindCSS).

---

## Tech Stack

- **Backend:**  
  - NestJS (TypeScript)
  - TypeORM (PostgreSQL)
  - Class Validator/Transformer
  - Docker
  - JWT authentication

- **Frontend:**  
  - Next.js (React)
  - TailwindCSS
  - Docker

---

## Setup & Installation

### Prerequisites

- Docker & Docker Compose installed
- Node.js (for local development)
- PostgreSQL (for local development)

### Steps

1. **Clone the repository**
2. **Configure environment variables:**  
   - In the `frontend` folder, create a `.env.local` file and set your frontend environment variables.
   - In the `backend` folder, create a `.env` file and set your backend environment variables.
   - You can copy from `.env.sample`.
3. **Start with Docker Compose:**
   ```sh
   docker-compose up --build
   ```
   This will:
   - Start a PostgreSQL database
   - Build and seed the backend
   - Start the API server (`localhost:3000`)
   - Start the frontend (`localhost:3001`)

4. **Manual (local) development:**  
   - Backend:  
     ```sh
     cd backend
     npm install
     npm run start:dev
     ```
   - Frontend:  
     ```sh
     cd frontend
     npm install
     npm run dev

     # Note: You must create your db locally first if you decide to run out of Docker. 
     ```

---

## Setting Up PostgreSQL with Docker (Standalone)

If you want to run a PostgreSQL database by yourself (outside of docker-compose), use the following command:

```sh
docker run --name inventory-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=inventory_mgmt -p 5433:5432 -d postgres:16
```

- This will start a PostgreSQL 16 container on port 5432 and automatically create the database `inventory_mgmt`.
- Update your `.env` or backend config to use, there's a sample in the .env.sample
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=postgres
  DB_PASSWORD=postgres
  DB_NAME=inventory_mgmt 
  ```

---

## How It Works

### Stores

- **Central Store:**  
  - The main warehouse for all products and SKUs.
- **Branch Stores:**  
  - Additional stores/warehouses that can hold inventory and receive transfers.

### Products & SKUs

- **Products:**  
  - Created via the frontend or API.
  - Each product can have multiple SKUs (stock keeping units) with unique codes and attributes.

- **Creating Products with SKUs:**  
  - Go to Products → Add Product.
  - Enter product details and add one or more SKUs (with attributes like color, size, etc.).

### Inventory

- **Creating Inventory:**  
  - Add inventory to the central store for a product/SKU.
  - Inventory can be viewed and managed per store.

### Reservations

- **Reserving Inventory:**  
  - Reserve stock from the central store for a branch.
  - Reservations are tracked and can be fulfilled or cancelled.

### Transfers

- **Transferring Inventory:**  
  - Reserved inventory can be transferred from the central store to a branch.

---

## Initial Seeding

- On first run, the backend seeds the database with sample stores, products, SKUs, and inventory.
- The seeder runs automatically via the `seed` service in Docker Compose.
- You can manually re-run the seeder with:
  ```sh
  npm run seed
  ```
- **Default login for the app:**  
  - Email: `admin@gmail.com`  
  - Password: `admin`
- **Authentication:**  
  - The backend API uses JWT for authentication.

---

## Useful Endpoints

- **Backend API:**  
  - `/api/stores` — Manage stores
  - `/api/products` — Manage products
  - `/api/sku` — Manage SKUs
  - `/api/stock/inventory` — Manage inventory
  - `/api/stock/reservations` — Manage reservations
  - `/api/stock/transfer` — Transfer reserved inventory

- **Frontend:**  
  - `/dashboard` — Aggregated overview
  - `/dashboard/stores` — Manage stores
  - `/dashboard/products` — Manage products
  - `/dashboard/stores/central` — Central inventory
  - `/dashboard/stores/branches` — Branch inventory


## Possible Improvements

- **Role Management:**  
  Implement user roles (e.g. admin, manager, staff) with permissions to restrict access to certain features and endpoints.

- **Notifications:**  
  Add notification for low stock, reservation status changes, or transfer completions.

- **Reporting & Analytics:**  
  Provide dashboards and downloadable reports for inventory movement, sales, and usage trends.
