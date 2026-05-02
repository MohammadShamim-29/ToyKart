export function categoryLabel(category) {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category.name ?? "";
}
