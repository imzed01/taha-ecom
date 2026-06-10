import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await dbConnect();
    const categories: string[] = await Product.distinct("category", {
      isActive: true,
    });

    // Filter, normalize, and group duplicates by canonical key
    const filtered = categories
      .map((c) => (typeof c === "string" ? c : ""))
      .filter((c) => c && c.trim().length > 0 && c !== "toy");

    const groups = new Map<string, { label: string; variants: string[] }>();
    const normalizeBase = (c: string) =>
      c
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const stripCommonSuffixes = (c: string) => {
      const suffixes = [
        " and tools",
        " tools",
        " and accessories",
        " accessories",
      ];
      let out = c;
      for (const suf of suffixes) {
        if (out.endsWith(suf)) {
          out = out.slice(0, -suf.length).trim();
        }
      }
      return out;
    };

    const singularizeLastWord = (c: string) => {
      const parts = c.split(" ").filter(Boolean);
      if (parts.length === 0) return c;
      let last = parts[parts.length - 1];

      // Basic plural rules
      if (last.endsWith("ies") && last.length > 3) {
        // batteries -> battery
        last = last.slice(0, -3) + "y";
      } else if (/(ches|shes|xes|zes)$/.test(last) && last.length > 4) {
        // watches -> watch, dishes -> dish, boxes -> box, prizes -> prize
        last = last.slice(0, -2); // remove 'es'
      } else if (
        last.endsWith("s") &&
        !last.endsWith("ss") &&
        !last.endsWith("us") &&
        !last.endsWith("is") &&
        !last.endsWith("ics") &&
        last.length > 3
      ) {
        // cars -> car (fallback simple rule)
        last = last.slice(0, -1);
      }

      parts[parts.length - 1] = last;
      return parts.join(" ");
    };

    const fixCommonTypos = (c: string) => {
      if (c === "electronis") return "electronics";
      if (c === "watche") return "watch";
      return c;
    };

    const toCanonical = (raw: string) => {
      let c = normalizeBase(raw);
      c = fixCommonTypos(c);
      c = stripCommonSuffixes(c);
      c = singularizeLastWord(c);
      // Remove clearly unwanted buckets
      if (c === "uncategorized" || c === "uncategorised") return "";
      // Merge standalone watch into jewelry bucket
      if (c === "watch") return "jewelry and watch";
      // Merge camera/projector, computer, and phone categories into electronics
      if (/(^|\b)(camera|cameras|projector|projectors)($|\b)/.test(c))
        return "electronics";
      if (/(^|\b)(computer|computers)($|\b)/.test(c)) return "electronics";
      if (/(^|\b)(phone|phones|smartphone|smartphones)($|\b)/.test(c))
        return "electronics";
      // Merge Home Improvement variants into Home Decoration & Appliance
      if (/^home improvement(\b|$)/.test(c))
        return "home decoration and appliance";
      // Remove Beauty, Health & Hair category (and similar wording)
      if (/^beauty( and)? health( and)? hair$/.test(c)) return "";
      return c;
    };

    const toTitleCase = (c: string) =>
      c
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
        .join(" ");

    for (const cat of filtered) {
      const canonical = toCanonical(cat);
      if (!canonical) continue;
      if (!groups.has(canonical)) {
        // Prefer a normalized, human-friendly label: Title Case of canonical
        groups.set(canonical, {
          label: toTitleCase(canonical),
          variants: [cat],
        });
      } else {
        const g = groups.get(canonical)!;
        if (!g.variants.includes(cat)) g.variants.push(cat);
      }
    }

    const result = Array.from(groups.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
