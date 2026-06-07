import prisma from "@/lib/prisma";

export async function getTopRecommendations(customerId: string) {
  // @ts-ignore
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    // @ts-ignore
    include: { preference: true, interactions: true, inquiries: true },
  });

  if (!customer || !customer.preference) return [];

  const pref = customer.preference;
  const availableCars = await prisma.car.findMany({ where: { status: "Available" } });

  const scoredCars = availableCars.map(car => {
    let score = 0;
    const reasons: string[] = [];

    // Budget match (40%)
    if (pref.budgetMin && pref.budgetMax) {
      if (car.expectedSellPrice >= pref.budgetMin && car.expectedSellPrice <= pref.budgetMax) {
        score += 40;
        reasons.push("Perfect Budget Match");
      } else if (car.expectedSellPrice <= pref.budgetMin) {
        score += 30; // Better to be under budget
        reasons.push("Under Budget");
      } else if (car.expectedSellPrice <= (pref.budgetMax * 1.1)) {
        score += 15; // Within 10% over tracking
        reasons.push("Slightly Over Budget");
      }
    }

    // Brand match (20%)
    if (pref.preferredBrands && pref.preferredBrands.includes(car.brand)) {
      score += 20;
      reasons.push("Preferred Brand Match");
    }

    // Fuel match (15%)
    if (pref.fuelType && car.fuelType && car.fuelType.toLowerCase().includes(pref.fuelType.toLowerCase())) {
      score += 15;
      reasons.push(`${car.fuelType} Match`);
    }

    // Age / Year match (15%)
    if (pref.minYear && car.year >= pref.minYear) {
      score += 15;
      reasons.push("Manufacture Year Match");
    }

    // KM match (10%)
    if (pref.maxKmDriven && car.kmDriven <= pref.maxKmDriven) {
      score += 10;
      reasons.push("Low Mileage Match");
    }

    // Smart Boosts (Bonus 15%)
    const daysOnLot = Math.floor((Date.now() - new Date(car.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOnLot > 30) {
      score += 5; // Internal boost to cycle aging inventory
    }

    if (pref.priority) {
      if (pref.priority === "PRICE" && car.expectedSellPrice <= (pref.budgetMax || 9999999)) score += 5;
      if (pref.priority === "MILEAGE" && car.kmDriven < 50000) score += 5;
    }

    return { car, score: Math.min(score, 100), reasons };
  });

  return scoredCars
    .filter(sc => sc.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Return top 5
}
