import React from "react";
import { Platform, Text, View } from "react-native";

const CustomMarker = ({
  label,
  isOrigin = false,
}: {
  label: string;
  isOrigin?: boolean;
}) => {
  return (
    <View className="items-center pt-3 z-[9998]">
      {/* Text above the pin */}
      <View
        className={`h-12 w-12 bg-green-700 rounded-full items-center justify-center relative z-[9999] ${isOrigin && "bg-[#0286FF]"}`}
      >
        <Text className="text-lg flex flex-col font-bold text-white text-center ">
          {label}
        </Text>
        <Text className="text-xs text-white -mt-1.5">km</Text>
      </View>
      <View className="w-1 bg-green-950 h-5 z-[1000] rounded-full absolute top-3/4" />

      {/* Marker Pin with Circle */}
      <View className="relative">
        <View className="absolute h-8 w-8 rounded-full" />
        <View
          style={{
            shadowColor: "green",
            elevation: 20,
            shadowOpacity: 0.55,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 0 },
          }}
          className={`h-7 w-7 bg-green-700 rounded-full items-center justify-center border-4 border-white shadow-md ${isOrigin && "bg-[#0286FF]"}`}
        >
          <View className="bg-white h-3 w-3 rounded-full" />
        </View>
      </View>
    </View>
  );
};

export default CustomMarker;
