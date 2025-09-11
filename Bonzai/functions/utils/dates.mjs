export function nightsBetween(checkInIso, checkOutIso) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const start = Date.parse(checkInIso); 
  const end = Date.parse(checkOutIso); 
  return Math.round((end - start) / msPerDay); 
}
