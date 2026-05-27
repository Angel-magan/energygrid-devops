export const DEFAULT_DISTRICT_CAPACITY_KW = 5000;

export const buildDistrictCapacityMap = (districts = []) =>
  districts.reduce((acc, district) => {
    const key = String(district?.id || district?.district_id || "").trim();
    if (!key) return acc;
    const capacity = Number(district?.capacity_max_kw);
    acc[key] =
      Number.isFinite(capacity) && capacity > 0
        ? capacity
        : DEFAULT_DISTRICT_CAPACITY_KW;
    return acc;
  }, {});

export const getDistrictCapacityMaxKw = (
  districtId,
  districtCapacities = {},
) => {
  const capacity = Number(districtCapacities?.[districtId]);
  return Number.isFinite(capacity) && capacity > 0
    ? capacity
    : DEFAULT_DISTRICT_CAPACITY_KW;
};

export const getUsagePct = (consumptionKw, capacityKw) => {
  const consumption = Number(consumptionKw);
  const capacity = Number(capacityKw);
  if (
    !Number.isFinite(consumption) ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    return NaN;
  }
  return (consumption / capacity) * 100;
};
