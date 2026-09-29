-- CreateTable
CREATE TABLE "assignments" (
    "assignment_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "assignment_name" VARCHAR(150) NOT NULL,
    "earned_points" DECIMAL(10,2) NOT NULL,
    "possible_points" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("assignment_id"),
    CONSTRAINT "assignments_earned_points_check" CHECK ("earned_points" >= 0),
    CONSTRAINT "assignments_possible_points_check" CHECK ("possible_points" > 0)
);

-- CreateIndex
CREATE INDEX "assignments_category_id_idx" ON "assignments"("category_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;
