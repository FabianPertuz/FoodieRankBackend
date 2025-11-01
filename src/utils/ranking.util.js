
function computeScore(restaurant = {}) {
    const ratingCount = restaurant.ratingCount || 0;
    const ratingSum = restaurant.ratingSum || 0;
    const base = ratingCount > 0 ? ratingSum / ratingCount : 0;
    const popularityFactor = Math.log(1 + ratingCount);
    const freshness = 0; // placeholder (could use lastReviewDate)
    const score = base * (1 + 0.1 * popularityFactor) + freshness;
    return Number(score.toFixed(3));
  }
  
  module.exports = { computeScore };
  