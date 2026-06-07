# Deployment Guide for AutoConsult Pro

This document outlines the step-by-step process to deploy your application online. The application contains a Next.js frontend and a Node.js/Express backend, both backed by a Neon PostgreSQL database.

---

## Part 1: Deploying the Backend on Render

Render is ideal for hosting your Node.js/Express backend server.

### Steps:
1. Log in to [Render](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository: **`AutoConsult-Pro`**.
4. Configure the service:
   - **Name**: `autoconsult-pro-backend`
   - **Language**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In the **Environment Variables** section, add the following key-value pairs:
   - `PORT`: `5000`
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_ZzKiV7taJ2Fq@ep-weathered-hat-ami32l5m-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `BACKEND_API_KEY`: `shakti_auto_consult_api_secret_key_2026_x92a`
6. Click **Deploy Web Service**.
7. Once deployed successfully, copy your backend live URL (e.g., `https://autoconsult-pro-backend.onrender.com`). You will use this in your frontend setup.

---

## Part 2: Deploying the Frontend on Vercel

Vercel is the recommended and easiest way to deploy a Next.js application.

### Steps:
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Import your GitHub repository: **`AutoConsult-Pro`**.
4. Configure the project:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend`.
5. Under **Environment Variables**, add the following key-value pairs:
   - `NEXT_PUBLIC_API_URL`: `https://YOUR-RENDER-BACKEND-URL/api` (Replace with the URL you copied from Render, ensuring it ends with `/api` e.g., `https://autoconsult-pro-backend.onrender.com/api`)
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_ZzKiV7taJ2Fq@ep-weathered-hat-ami32l5m-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `BACKEND_API_KEY`: `shakti_auto_consult_api_secret_key_2026_x92a`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `pk_test_dGhhbmtmdWwtcGFycm90LTQ0LmNsZXJrLmFjY291bnRzLmRldiQ`
   - `CLERK_SECRET_KEY`: `sk_test_o0wKlJdjO8RqjhoQOkQudSz3jPrJp32PmWE8q5NY0i`
6. Click **Deploy**.

Once deployment is complete, your Next.js application will be live at a custom `.vercel.app` domain!
