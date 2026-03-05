# Test Plan - Global System Verification

## Objective
Verify that all frontend pages are functional, images load correctly, and API requests to the backend are successful across all modules.

## 1. Frontend Page Audit
- [ ] **Home Page**: Verify hero banners, featured products, and navigation.
- [ ] **Collections (Caftans, Accessoires, etc.)**: Verify product grid, filtering (bilingual), and pagination.
- [ ] **Product Detail**: Verify image gallery, variant selection (size/color), and "Add to Cart".
- [ ] **Cart & Checkout**: Verify bag summary, item removal, and order submission.
- [ ] **Contact Page**: Verify form submission and success message.
- [ ] **Wishlist**: Verify adding/removing items.

## 2. Admin Dashboard Audit
- [ ] **Dashboard Stats**: Verify charts and counters load.
- [ ] **Product Management**: Test creating/updating a product with images and attributes.
- [ ] **Orders Management**: Verify listing and status updates.
- [ ] **Messages**: Verify inbox and mark as read.
- [ ] **Hero/Promos**: Verify banner management.

## 3. Backend & Infrastructure
- [ ] **Static File Serving**: Confirm consistency in image URLs.
- [ ] **Error Handling**: Verify global error middleware and validation logging.
- [ ] **Port Stability**: Confirm no double-process conflicts.
