import { describe, it, expect } from "vitest";

interface Listing {
  id: string;
  title: string;
  price: number;
  city: string;
  rooms: number | null;
  area: number | null;
  has_parking: boolean | null;
  description: string | null;
}

// Extract the filtering logic from Main.tsx for testing
function filterListings(
  listings: Listing[],
  filters: {
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    rooms?: string;
    propertyType?: string;
    minArea?: string;
    maxArea?: string;
    hasParking?: boolean;
  },
  canUseFilters: boolean
): Listing[] {
  return listings.filter((listing) => {
    if (!canUseFilters) return true;
    if (filters.city && filters.city !== "all" && listing.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.minPrice && listing.price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && listing.price > parseInt(filters.maxPrice)) return false;
    if (filters.rooms && listing.rooms !== parseInt(filters.rooms)) return false;
    if (filters.propertyType && filters.propertyType !== "all") {
      const searchText = (listing.title + " " + (listing.description || "")).toLowerCase();
      if (filters.propertyType === "apartment" && !searchText.includes("квартир")) return false;
      if (filters.propertyType === "house" && !searchText.includes("будин") && !searchText.includes("дім") && !searchText.includes("котедж")) return false;
      if (filters.propertyType === "studio" && !searchText.includes("студі")) return false;
      if (filters.propertyType === "room" && (!searchText.includes("кімнат") || searchText.includes("квартир"))) return false;
    }
    if (filters.minArea && (listing.area === null || listing.area < parseFloat(filters.minArea))) return false;
    if (filters.maxArea && (listing.area === null || listing.area > parseFloat(filters.maxArea))) return false;
    if (filters.hasParking && !listing.has_parking) return false;
    return true;
  });
}

const mockListings: Listing[] = [
  { id: "1", title: "Квартира в центрі", price: 15000, city: "Київ", rooms: 2, area: 55, has_parking: true, description: "Гарна квартира" },
  { id: "2", title: "Будинок за містом", price: 25000, city: "Львів", rooms: 4, area: 120, has_parking: true, description: "Великий будинок" },
  { id: "3", title: "Студія біля метро", price: 8000, city: "Київ", rooms: 1, area: 30, has_parking: false, description: "Студія" },
  { id: "4", title: "Кімната в квартирі", price: 5000, city: "Одеса", rooms: 1, area: 15, has_parking: false, description: "Кімната" },
  { id: "5", title: "Котедж в передмісті", price: 35000, city: "Харків", rooms: 5, area: 200, has_parking: true, description: "Котедж" },
];

describe("Listing Filtering", () => {
  it("returns all listings when filters disabled (basic plan)", () => {
    const result = filterListings(mockListings, { city: "Київ" }, false);
    expect(result).toHaveLength(5);
  });

  it("filters by city", () => {
    const result = filterListings(mockListings, { city: "Київ" }, true);
    expect(result).toHaveLength(2);
    expect(result.every((l) => l.city === "Київ")).toBe(true);
  });

  it("filters by price range", () => {
    const result = filterListings(mockListings, { minPrice: "10000", maxPrice: "30000" }, true);
    expect(result).toHaveLength(2);
  });

  it("filters by rooms", () => {
    const result = filterListings(mockListings, { rooms: "1" }, true);
    expect(result).toHaveLength(2);
  });

  it("filters by property type - apartment", () => {
    const result = filterListings(mockListings, { propertyType: "apartment" }, true);
    // "квартира" matches both id:1 (квартира в центрі) and id:4 (кімната в квартирі)
    expect(result).toHaveLength(2);
  });

  it("filters by property type - house", () => {
    const result = filterListings(mockListings, { propertyType: "house" }, true);
    expect(result).toHaveLength(2); // будинок + котедж
  });

  it("filters by area range", () => {
    const result = filterListings(mockListings, { minArea: "50", maxArea: "150" }, true);
    expect(result).toHaveLength(2);
  });

  it("filters by parking", () => {
    const result = filterListings(mockListings, { hasParking: true }, true);
    expect(result).toHaveLength(3);
  });

  it("combines multiple filters", () => {
    const result = filterListings(mockListings, { city: "Київ", minPrice: "10000" }, true);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty when no matches", () => {
    const result = filterListings(mockListings, { city: "Запоріжжя" }, true);
    expect(result).toHaveLength(0);
  });

  it("'all' city returns everything", () => {
    const result = filterListings(mockListings, { city: "all" }, true);
    expect(result).toHaveLength(5);
  });
});

describe("Performance - Filtering speed", () => {
  it("filters 5000 listings in under 50ms", () => {
    const largeMock: Listing[] = Array.from({ length: 5000 }, (_, i) => ({
      id: String(i),
      title: `Квартира ${i}`,
      price: 5000 + Math.floor(Math.random() * 50000),
      city: ["Київ", "Львів", "Одеса", "Харків"][i % 4],
      rooms: (i % 4) + 1,
      area: 20 + Math.floor(Math.random() * 200),
      has_parking: i % 3 === 0,
      description: `Опис оголошення ${i}`,
    }));

    const start = performance.now();
    filterListings(largeMock, { city: "Київ", minPrice: "10000", maxPrice: "30000", hasParking: true }, true);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
