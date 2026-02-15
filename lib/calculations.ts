export const calculatePricePerLiter = (totalPrice: number, liters: number): number => {
    if (!liters || liters === 0) return 0;
    return Math.round(totalPrice / liters);
};

export const calculateDistance = (currentOdometer: number, previousOdometer: number): number => {
    if (!currentOdometer || !previousOdometer) return 0;
    const distance = currentOdometer - previousOdometer;
    return distance > 0 ? distance : 0;
};

export const calculateEfficiency = (currentOdometer: number, previousOdometer: number, liters: number): number => {
    const distance = calculateDistance(currentOdometer, previousOdometer);
    if (distance <= 0 || !liters || liters === 0) return 0;
    return parseFloat((distance / liters).toFixed(2));
};

export const calculateEstimatedDistance = (tankCapacity: number | undefined, efficiency: number): number => {
    if (!tankCapacity || !efficiency || efficiency <= 0) return 0;
    return Math.round(tankCapacity * efficiency);
};
