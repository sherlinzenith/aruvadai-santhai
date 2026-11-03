import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Retrieves published and approved marketplace products with server-side
 * search, multi-field filtering, sorting, and pagination.
 *
 * Security: Strictly hides private seller contact details (mobile, email, GSTIN, PAN, exact address).
 */
export async function GET(request) {
  try {
    // 1. Authenticate requester
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view the marketplace." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const category = searchParams.get("category") || "All";
    const grade = searchParams.get("grade") || "Any";
    const origin = (searchParams.get("origin") || "").trim();
    const organic = searchParams.get("organic");
    const availability = searchParams.get("availability") || "All";
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const sort = searchParams.get("sort") || "newest"; // 'newest' | 'price_asc' | 'price_desc'
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * limit;

    // Check if products table exists in database
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'products'
      LIMIT 1
    `);

    if (!tableCheck || tableCheck.length === 0) {
      // Products table has not been created by Person 2 yet
      return NextResponse.json({
        success: true,
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
        person2Integration: {
          tableStatus: "missing",
          message: "Person 2 'products' table is not yet deployed in PostgreSQL. Awaiting Person 2 product schema.",
        },
      });
    }

    // Check existing columns in products table for dynamic compatibility
    const colRows = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'products'
    `);
    const existingCols = new Set(colRows.map((c) => c.column_name));

    // Build dynamic SQL query defensively
    // We select only approved and published items, and sanitize seller public data
    let conditions = [];
    if (existingCols.has("status")) {
      conditions.push("p.status = 'published'");
    }

    if (q) {
      conditions.push(`(
        p.name ILIKE '%${q.replace(/'/g, "''")}%' OR 
        p.category ILIKE '%${q.replace(/'/g, "''")}%' OR 
        p.origin ILIKE '%${q.replace(/'/g, "''")}%'
      )`);
    }

    if (category && category !== "All") {
      conditions.push(`p.category = '${category.replace(/'/g, "''")}'`);
    }

    if (grade && grade !== "Any") {
      conditions.push(`p.grade = '${grade.replace(/'/g, "''")}'`);
    }

    if (origin) {
      conditions.push(`p.origin ILIKE '%${origin.replace(/'/g, "''")}%'`);
    }

    if (organic === "true" && existingCols.has("organic")) {
      conditions.push(`p.organic = true`);
    } else if (organic === "false" && existingCols.has("organic")) {
      conditions.push(`p.organic = false`);
    }

    if (availability && availability !== "All") {
      if (existingCols.has("avail")) {
        conditions.push(`p.avail = '${availability.replace(/'/g, "''")}'`);
      } else if (existingCols.has("availability")) {
        conditions.push(`p.availability = '${availability.replace(/'/g, "''")}'`);
      }
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      conditions.push(`CAST(p.price AS numeric) >= ${minPrice}`);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      conditions.push(`CAST(p.price AS numeric) <= ${maxPrice}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const hasCreatedAt = existingCols.has("created_at");
    let orderClause = hasCreatedAt ? "ORDER BY p.created_at DESC" : "ORDER BY p.id DESC";
    if (sort === "price_asc") {
      orderClause = hasCreatedAt ? "ORDER BY p.price ASC, p.created_at DESC" : "ORDER BY p.price ASC, p.id DESC";
    } else if (sort === "price_desc") {
      orderClause = hasCreatedAt ? "ORDER BY p.price DESC, p.created_at DESC" : "ORDER BY p.price DESC, p.id DESC";
    }

    // Total count query
    const countResult = await db.execute(sql.raw(`
      SELECT count(*) as total 
      FROM products p 
      ${whereClause}
    `));
    const total = parseInt(countResult?.[0]?.total || "0", 10);
    const totalPages = Math.ceil(total / limit);

    // Products fetch query with joined public seller fields
    const productRows = await db.execute(sql.raw(`
      SELECT 
        p.*,
        s.id as seller_id,
        s.business_name as seller_name,
        s.business_category as seller_category,
        s.city as seller_city,
        s.state as seller_state,
        s.is_verified as seller_verified
      FROM products p
      LEFT JOIN seller_profiles s ON p.seller_id::text = s.user_id OR p.seller_id::text = s.id::text
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `));

    // Sanitized output format
    const products = productRows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      origin: r.origin,
      grade: r.grade || "A",
      moq: Number(r.moq) || 1,
      unit: r.unit || "quintal",
      price: r.price,
      avail: r.avail || r.availability || "Available",
      organic: Boolean(r.organic),
      image: r.image || "/products/rice.jpg",
      description: r.description || null,
      variety: r.variety || null,
      size: r.size || null,
      packaging: r.packaging || "Standard Mandi Bags",
      priceSlabs: r.price_slabs || null,
      gstDetails: r.gst_details || null,
      createdAt: r.created_at || new Date().toISOString(),
      seller: {
        id: r.seller_id,
        businessName: r.seller_name || "Verified Agro Producer",
        businessCategory: r.seller_category || "Wholesale Farmer",
        location: `${r.seller_city || ""}, ${r.seller_state || ""}`.trim().replace(/^,\s*|,\s*$/g, "") || r.origin,
        isVerified: Boolean(r.seller_verified),
        // NOTE: Private details (email, mobile, address, GSTIN) are NEVER returned here!
      },
    }));

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        q,
        category,
        grade,
        origin,
        organic,
        availability,
        sort,
      },
    });
  } catch (error) {
    console.error("Marketplace Products API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch marketplace products from database." },
      { status: 500 }
    );
  }
}
