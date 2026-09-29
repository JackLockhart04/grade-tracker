-- CreateTable
CREATE TABLE "courses" (
    "course_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_name" VARCHAR(150) NOT NULL,
    "term" VARCHAR(100) NOT NULL,
    "credit_hours" DECIMAL(4,1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id"),
    CONSTRAINT "courses_credit_hours_check" CHECK ("credit_hours" >= 0.5 AND "credit_hours" <= 30)
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "weight_percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id"),
    CONSTRAINT "categories_weight_percentage_check" CHECK ("weight_percentage" > 0 AND "weight_percentage" <= 100)
);

-- CreateIndex
CREATE INDEX "courses_user_id_idx" ON "courses"("user_id");

-- CreateIndex
CREATE INDEX "categories_course_id_idx" ON "categories"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_course_id_category_name_key" ON "categories"("course_id", "category_name");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;
