-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainSettings" (
    "id" SERIAL NOT NULL,
    "customer_url" TEXT,
    "admin_url" TEXT,
    "api_base_url" TEXT,
    "canonical_url" TEXT,
    "whatsapp_booking_url" TEXT,
    "logo_url" TEXT,
    "image_base_url" TEXT,
    "sitemap_url" TEXT,
    "robots_settings" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "max_load" TEXT,
    "image_url" TEXT,
    "recommended_use" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceMaster" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "supplier_id" INTEGER,
    "zone_id" INTEGER,
    "item_type" TEXT,
    "pricing_type" TEXT NOT NULL DEFAULT 'standard',
    "unit_type" TEXT,
    "per_unit_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_fare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "per_km_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_km_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "slab_json" TEXT NOT NULL DEFAULT '[]',
    "loading_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unloading_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waiting_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "helper_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "labour_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toll_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parking_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "night_charge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "express_charge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peak_surcharge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rain_surcharge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demand_surcharge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operator_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuel_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobilization_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "demobilization_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_hour_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refill_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driver_allowance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "night_halt_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "state_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_day_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platform_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advance_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_booking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "round_trip_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.8,
    "rush_surcharge_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "pin_codes" TEXT,
    "cities" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_order_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usage_limit" INTEGER NOT NULL DEFAULT 0,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "booking_id" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "service_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "supplier_id" INTEGER,
    "pickup_address" TEXT,
    "pickup_lat" DOUBLE PRECISION,
    "pickup_lng" DOUBLE PRECISION,
    "pickup_map_link" TEXT,
    "drop_address" TEXT,
    "drop_lat" DOUBLE PRECISION,
    "drop_lng" DOUBLE PRECISION,
    "drop_map_link" TEXT,
    "distance_km" DOUBLE PRECISION,
    "distance_method" TEXT,
    "schedule_date" TEXT,
    "schedule_time" TEXT,
    "item_details" TEXT,
    "weight" TEXT,
    "quantity" TEXT,
    "trip_type" TEXT,
    "duration_hours" DOUBLE PRECISION,
    "duration_days" DOUBLE PRECISION,
    "unit_type" TEXT,
    "unit_quantity" DOUBLE PRECISION,
    "material_cost" DOUBLE PRECISION,
    "delivery_charge" DOUBLE PRECISION,
    "rush_surcharge_applied" DOUBLE PRECISION,
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "zone_id" INTEGER,
    "coupon_code" TEXT,
    "coupon_discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surge_applied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "photo_url" TEXT,
    "file_name" TEXT,
    "file_type" TEXT,
    "landmark" TEXT,
    "eta_text" TEXT,
    "fare_snapshot_json" TEXT NOT NULL DEFAULT '{}',
    "final_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_applied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "admin_final_amount" DOUBLE PRECISION,
    "payment_option" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "payment_received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_screenshot_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "driver_name" TEXT,
    "driver_mobile" TEXT,
    "driver_type" TEXT,
    "admin_notes" TEXT,
    "customer_notes" TEXT,
    "created_by_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "shop_name" TEXT,
    "mobile" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "address_lat" DOUBLE PRECISION,
    "address_lng" DOUBLE PRECISION,
    "address_map_link" TEXT,
    "flat_delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "map_location" TEXT,
    "supplier_type" TEXT,
    "aadhaar_url" TEXT,
    "pan_url" TEXT,
    "gst_url" TEXT,
    "udyam_url" TEXT,
    "fssai_url" TEXT,
    "bank_details" TEXT,
    "upi_id" TEXT,
    "qr_url" TEXT,
    "shop_photo_url" TEXT,
    "service_area" TEXT,
    "commission_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "product_name" TEXT NOT NULL,
    "brand" TEXT,
    "pack_size" TEXT,
    "unit" TEXT,
    "mrp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "market_low_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "market_high_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "supplier_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selling_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margin_percent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "gst_percent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "handling_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_source" TEXT,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expiry_responsibility" TEXT,
    "photo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "city" TEXT,
    "pincode" TEXT,
    "last_updated" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_option" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'Pending',
    "screenshot_url" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Owner',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "force_password_change" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminActivity" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT,
    "changed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoSetting" (
    "id" SERIAL NOT NULL,
    "page_slug" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "canonical_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" SERIAL NOT NULL,
    "contact" TEXT NOT NULL,
    "contact_type" TEXT NOT NULL,
    "source_page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSection" (
    "id" SERIAL NOT NULL,
    "section_key" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "body" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apk" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "download_url" TEXT,
    "version" TEXT,
    "file_size" TEXT,
    "developer" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "maintenance_mode" TEXT NOT NULL DEFAULT 'Off',
    "maintenance_msg" TEXT,
    "payment_type" TEXT NOT NULL DEFAULT 'Free',
    "upi_id" TEXT,
    "upi_payee_name" TEXT,
    "payment_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_cycle" TEXT,
    "payment_notes" TEXT,
    "qr_url" TEXT,
    "coming_soon" BOOLEAN NOT NULL DEFAULT false,
    "coming_soon_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_slug_key" ON "Zone"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_booking_id_key" ON "Booking"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SeoSetting_page_slug_key" ON "SeoSetting"("page_slug");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_contact_key" ON "Waitlist"("contact");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSection_section_key_key" ON "ContentSection"("section_key");

-- CreateIndex
CREATE UNIQUE INDEX "Apk_slug_key" ON "Apk"("slug");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMaster" ADD CONSTRAINT "PriceMaster_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMaster" ADD CONSTRAINT "PriceMaster_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMaster" ADD CONSTRAINT "PriceMaster_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMaster" ADD CONSTRAINT "PriceMaster_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

