-- DropForeignKey
ALTER TABLE "NetworkReview" DROP CONSTRAINT "NetworkReview_reviewPackageId_fkey";

-- DropForeignKey
ALTER TABLE "NetworkReviewAudit" DROP CONSTRAINT "NetworkReviewAudit_reviewId_fkey";

-- AddForeignKey
ALTER TABLE "NetworkReview" ADD CONSTRAINT "NetworkReview_reviewPackageId_fkey" FOREIGN KEY ("reviewPackageId") REFERENCES "NetworkReviewPackage"("reviewPackageId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewAudit" ADD CONSTRAINT "NetworkReviewAudit_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "NetworkReview"("reviewId") ON DELETE RESTRICT ON UPDATE CASCADE;
