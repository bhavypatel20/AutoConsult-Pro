import { NextResponse } from "next/server";
import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // 1. Verify user authentication & active business
    const context = await getActiveBusiness();
    if (!context) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const businessId = context.business.id;

    // 2. Query Prisma to verify the business owns the car with this document
    const car = await prisma.car.findFirst({
      where: {
        businessId,
        documents: `/api/documents/${filename}`,
      },
    });

    if (!car) {
      return new NextResponse("Forbidden: Access denied to this file", { status: 403 });
    }

    // 3. Read the private document file
    const filePath = path.join(process.cwd(), "private_documents", filename);
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      // Determine content type based on extension
      let contentType = "application/pdf";
      const ext = path.extname(filename).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") {
        contentType = "image/jpeg";
      } else if (ext === ".png") {
        contentType = "image/png";
      }

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      });
    } catch (err) {
      return new NextResponse("File not found", { status: 404 });
    }
  } catch (error: any) {
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
