import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { LatLng, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";

import CustomMarker from "./CustomMarker";

const directionsAPI =
  Platform.OS === "android"
    ? process.env.EXPO_PUBLIC_ANDROID_GOOGLE_API_KEY
    : process.env.EXPO_PUBLIC_IOS_GOOGLE_API_KEY;

// Function to interpolate points between two coordinates
const interpolatePoints = (start: LatLng, end: LatLng, numPoints: number) => {
  const latStep = (end.latitude - start.latitude) / numPoints;
  const lonStep = (end.longitude - start.longitude) / numPoints;

  const points = [];
  for (let i = 1; i < numPoints; i++) {
    points.push({
      latitude: start.latitude + latStep * i,
      longitude: start.longitude + lonStep * i,
    });
  }
  return points;
};

const Map = () => {
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { selectedDriver, setDrivers } = useDriverStore();

  const {
    data: drivers,
    loading,
    error,
    refetch,
  } = useFetch<Driver[]>("/(api)/driver");
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [originDots, setOriginDots] = useState<LatLng[]>([]);
  const [destinationDots, setDestinationDots] = useState<LatLng[]>([]);

  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  const region = calculateRegion({
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  });

  if (loading || (!userLatitude && !userLongitude))
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
      </View>
    );

  if (error)
    return (
      <View className="flex justify-between items-center w-full">
        <Text>Error: {error}</Text>
        <TouchableWithoutFeedback onPress={refetch}>
          <Text>Refresh</Text>
        </TouchableWithoutFeedback>
      </View>
    );

  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      className="w-full h-full rounded-3xl"
      tintColor="black"
      mapType={Platform.OS === "ios" ? "mutedStandard" : "terrain"}
      showsPointsOfInterest={false}
      initialRegion={region}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
        >
          <View className="h-10 w-12">
            <Image
              resizeMode="contain"
              source={
                selectedDriver === +marker.id
                  ? icons.selectedMarker
                  : icons.marker
              }
              className="h-full w-full"
            />
          </View>
        </Marker>
      ))}

      {destinationLatitude && destinationLongitude && (
        <>
          {/* Origin Marker */}
          <Marker
            key="origin"
            coordinate={{
              latitude: userLatitude!,
              longitude: userLongitude!,
            }}
            title="Origin"
          >
            <CustomMarker label={"D"} isOrigin={true} />
          </Marker>

          {/* Destination Marker */}
          <Marker
            description=""
            key="destination"
            coordinate={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            title="Destination"
          >
            <CustomMarker label={"D"} />
          </Marker>

          {/* MapViewDirections for Route */}
          <MapViewDirections
            origin={{
              latitude: userLatitude!,
              longitude: userLongitude!,
            }}
            destination={{
              latitude: destinationLatitude,
              longitude: destinationLongitude,
            }}
            apikey={directionsAPI!}
            strokeColor="#0286FF"
            strokeWidth={6}
            onReady={(result) => {
              const coordinates = result.coordinates.map((step) => ({
                latitude: step.latitude,
                longitude: step.longitude,
              }));
              setRouteCoords(coordinates); // Store the route coordinates

              // Interpolate dots between origin marker and first point of the route
              const originGapDots = interpolatePoints(
                { latitude: userLatitude!, longitude: userLongitude! },
                coordinates[0], // first point of the route
                5 // number of dots (adjust as needed)
              );
              setOriginDots(originGapDots);

              // Interpolate dots between last point of the route and destination marker
              const destinationGapDots = interpolatePoints(
                coordinates[coordinates.length - 1], // last point of the route
                {
                  latitude: destinationLatitude,
                  longitude: destinationLongitude,
                },
                5 // number of dots (adjust as needed)
              );
              setDestinationDots(destinationGapDots);
            }}
          />
        </>
      )}

      {/* Render interpolated dots between origin marker and route start */}
      {originDots.map((coord, index) => (
        <Marker key={`origin-dot-${index}`} coordinate={coord}>
          <View
            style={{
              width: 5,
              height: 5,
              backgroundColor: "orange",
              borderRadius: 2.5,
            }}
          />
        </Marker>
      ))}

      {/* Render interpolated dots between route end and destination marker */}
      {destinationDots.map((coord, index) => (
        <Marker key={`destination-dot-${index}`} coordinate={coord}>
          <View
            style={{
              width: 5,
              height: 5,
              backgroundColor: "green",
              borderRadius: 2.5,
            }}
          />
        </Marker>
      ))}
    </MapView>
  );
};

export default Map;
