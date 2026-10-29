import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { cacheDel, cacheGet, cacheSet, menuCacheKey } from "@/lib/cache/menu";
import { DEFAULT_STORE_ID } from "@/lib/store";
import { basePriceForItem, optionGroupsFor } from "@/lib/customizations";
import { serverErrorJson } from "@/lib/publicError";

export async function GET(request: Request) {
  try {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();
  const featured = searchParams.get("featured") === "true";

  const session = await getServerSession(authOptions);
  const storeId = session?.user.storeId || DEFAULT_STORE_ID;
  const showHidden = session?.user.role === "admin" && searchParams.get("all") === "true";
  const cacheKey = menuCacheKey(storeId, `hf8:${showHidden ? "all" : "pub"}:${category || ""}:${q || ""}:${featured}`);

  if (!q) {
    const cached = await cacheGet<{ items: unknown; categories: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
  }

  const items = await prisma.menuItem.findMany({
    where: {
      storeId,
      ...(showHidden ? {} : { isAvailable: true }),
      ...(category && category !== "all" ? { category: { slug: category } } : {}),
      ...(featured ? { isFeatured: true } : {}),
      ...(q
        ? {
            OR: [{ name: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const used = new Set(items.map((item) => item.categoryId));
  const categories = (await prisma.category.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
  })).filter((row) => showHidden || used.has(row.id));

  const payload = {
    items: items.map((item) => {
      const portions = {
        price: item.price,
        halfPrice: item.halfPrice,
        fullPrice: item.fullPrice,
      };
      const editableOptionGroups = optionGroupsFor(
        item.category.slug,
        item.isVeg,
        portions,
        item.customizationsJson,
        { includeHidden: true }
      );
      return {
        ...item,
        price: basePriceForItem(portions),
        optionGroups: showHidden
          ? editableOptionGroups
          : optionGroupsFor(item.category.slug, item.isVeg, portions, item.customizationsJson),
        editableOptionGroups: showHidden ? editableOptionGroups : undefined,
      };
    }),
    categories,
  };
  if (!q) await cacheSet(cacheKey, payload);
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
  } catch (error) {
    console.error("[menu GET]", error);
    return serverErrorJson();
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const storeId = session.user.storeId || DEFAULT_STORE_ID;
  try {
  const baseSlug = (body.slug || String(body.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "item").replace(/^-|-$/g, "");
  let slug = baseSlug;
  let n = 2;
  while (await prisma.menuItem.findUnique({ where: { storeId_slug: { storeId, slug } } })) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }

  const halfPrice =
    body.halfPrice !== undefined && body.halfPrice !== "" && body.halfPrice !== null
      ? Number(body.halfPrice)
      : Number(body.price);
  const fullPrice =
    body.fullPrice !== undefined && body.fullPrice !== "" && body.fullPrice !== null
      ? Number(body.fullPrice)
      : null;

  const item = await prisma.menuItem.create({
    data: {
      storeId,
      name: body.name,
      slug,
      categoryId: body.categoryId,
      description: body.description || "",
      price: Number.isNaN(halfPrice) ? Number(body.price) : halfPrice,
      halfPrice: Number.isNaN(halfPrice) ? null : halfPrice,
      fullPrice: fullPrice != null && !Number.isNaN(fullPrice) ? fullPrice : null,
      imageUrl: body.imageUrl || "",
      isVeg: Boolean(body.isVeg),
      isAvailable: body.isAvailable === true,
      isFeatured: Boolean(body.isFeatured),
    },
    include: { category: true },
  });

  await cacheDel(menuCacheKey(session.user.storeId || DEFAULT_STORE_ID));
  return NextResponse.json({ item });
  } catch (error) {
    console.error("[menu POST]", error);
    return serverErrorJson();
  }
}
