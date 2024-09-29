import { LatLng } from "react-native-maps";

import { Driver, MarkerData } from "@/types/type";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return;

  // Fuel price and fare factors
  const fuelPricePerLiter = 1200; // ₦1200 per liter
  const baseFare = 1500; // Base fare ₦1500
  const timeFarePerMinute = 20; // Charge ₦10 per minute
  const distanceFarePerKm = 150; // Charge ₦100 per kilometer
  const avgFuelConsumptionPerKm = 8; // 10 km per liter fuel consumption

  try {
    const timesPromises = markers.map(async (marker) => {
      // Get the time and distance to the user
      const responseToUser = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${marker.latitude},${marker.longitude}&destination=${userLatitude},${userLongitude}&key=${directionsAPI}`
      );
      const dataToUser = await responseToUser.json();
      const legToUser = dataToUser.routes[0].legs[0];
      const timeToUser = legToUser.duration.value; // Time in seconds
      const distanceToUser = legToUser.distance.value / 1000; // Distance in kilometers

      // Get the time and distance from the user to the destination
      const responseToDestination = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${userLatitude},${userLongitude}&destination=${destinationLatitude},${destinationLongitude}&key=${directionsAPI}`
      );
      const dataToDestination = await responseToDestination.json();
      const legToDestination = dataToDestination.routes[0].legs[0];
      const timeToDestination = legToDestination.duration.value; // Time in seconds
      const distanceToDestination = legToDestination.distance.value / 1000; // Distance in kilometers

      // Total time and distance
      const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
      const totalDistance = distanceToUser + distanceToDestination; // Total distance in kilometers

      // Calculate fuel cost based on distance
      const fuelCost =
        (totalDistance / avgFuelConsumptionPerKm) * fuelPricePerLiter;

      // Calculate the final price
      let price =
        baseFare + // Base fare
        totalTime * timeFarePerMinute + // Time-based fare
        totalDistance * distanceFarePerKm + // Distance-based fare
        fuelCost; // Fuel cost

      // Round the price up to the nearest ₦100
      price = Math.ceil(price / 100) * 100;

      return { ...marker, time: totalTime, price: price.toFixed(2) };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    console.error("Error calculating driver times and price:", error);
  }
};

// Calculate the distance between two coordinates using the Haversine formula
export const calculateDistance = (coord1: LatLng, coord2: LatLng): number => {
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const earthRadius = 6371; // Earth radius in kilometers

  return earthRadius * c;
};
