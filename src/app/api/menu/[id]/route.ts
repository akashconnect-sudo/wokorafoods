import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { cacheDel, menuCacheKey } from "@/lib/cache/menu";
import { DEFAULT_STORE_ID } from "@/lib/store";
import { serverErrorJson } from "@/lib/publicError";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const body = await request.json();
  try {
  const halfPrice =
    body.halfPrice !== undefined && body.halfPrice !== "" && body.halfPrice !== null
      ? Number(body.halfPrice)
      : undefined;
  const fullPrice =
    body.fullPrice !== undefined && body.fullPrice !== "" && body.fullPrice !== null
      ? Number(body.fullPrice)
      : undefined;
  const price =
    body.price !== undefined
      ? Number(body.price)
      : halfPrice !== undefined && !Number.isNaN(halfPrice)
        ? halfPrice
        : undefined;

  const item = await prisma.menuItem.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(price !== undefined && !Number.isNaN(price) ? { price } : {}),
      ...(halfPrice !== undefined
        ? { halfPrice: Number.isNaN(halfPrice) ? null : halfPrice }
        : {}),
      ...(fullPrice !== undefined
        ? { fullPrice: Number.isNaN(fullPrice) ? null : fullPrice }
        : {}),
      ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
      ...(body.isVeg !== undefined ? { isVeg: Boolean(body.isVeg) } : {}),
      ...(body.isAvailable !== undefined ? { isAvailable: Boolean(body.isAvailable) } : {}),
      ...(body.isFeatured !== undefined ? { isFeatured: Boolean(body.isFeatured) } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
    },
    include: { category: true },
  });

  await cacheDel(menuCacheKey(DEFAULT_STORE_ID));
  return NextResponse.json({ item });
  } catch (error) {
    console.error("[menu PATCH]", error);
    return serverErrorJson();
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const denied = await assertAdmin();
  if (denied) return denied;

  try {
  await prisma.menuItem.delete({ where: { id: params.id } });
  await cacheDel(menuCacheKey(DEFAULT_STORE_ID));
  return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[menu DELETE]", error);
    return serverErrorJson();
  }
}
