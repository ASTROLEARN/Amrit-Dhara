-- CreateTable
CREATE TABLE "public"."groundwater_samples" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "arsenic" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cadmium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "chromium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lead" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mercury" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nickel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "copper" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zinc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hpi" DOUBLE PRECISION,
    "hei" DOUBLE PRECISION,
    "cd" DOUBLE PRECISION,
    "npi" DOUBLE PRECISION,
    "hpiCategory" TEXT,
    "heiCategory" TEXT,
    "cdCategory" TEXT,
    "npiCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groundwater_samples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analysis_results" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "hpi" DOUBLE PRECISION NOT NULL,
    "hei" DOUBLE PRECISION NOT NULL,
    "cd" DOUBLE PRECISION NOT NULL,
    "npi" DOUBLE PRECISION NOT NULL,
    "hpiCategory" TEXT NOT NULL,
    "heiCategory" TEXT NOT NULL,
    "cdCategory" TEXT NOT NULL,
    "npiCategory" TEXT NOT NULL,
    "overallQuality" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);
