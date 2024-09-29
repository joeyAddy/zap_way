import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { Paystack, paystackProps } from "react-native-paystack-webview";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { PaymentProps } from "@/types/type";

const PaystackPayment = ({
  fullName,
  email,
  amount,
  driverId,
  rideTime,
}: PaymentProps) => {
  const {
    userAddress,
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationAddress,
    destinationLongitude,
  } = useLocationStore();

  const paystackWebViewRef = useRef<paystackProps.PayStackRef>();

  const { userId } = useAuth();
  const [success, setSuccess] = useState<boolean>(false);

  return (
    <>
      <CustomButton
        title="Confirm Ride"
        className="my-10"
        onPress={() => paystackWebViewRef.current?.startTransaction()}
      />

      <Paystack
        paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_KEY!}
        billingEmail={email}
        billingName={fullName}
        activityIndicatorColor="#0286FF"
        amount={amount}
        autoStart={false}
        onCancel={(e) => {
          // handle response here
        }}
        onSuccess={async (res) => {
          console.log("====================================");
          console.log("PAYSTACK RESP{ONSE", res);
          console.log("====================================");
          setSuccess(true);

          try {
            await fetchAPI("/(api)/ride/create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                origin_address: userAddress,
                destination_address: destinationAddress,
                origin_latitude: userLatitude,
                origin_longitude: userLongitude,
                destination_latitude: destinationLatitude,
                destination_longitude: destinationLongitude,
                ride_time: rideTime.toFixed(0),
                fare_price: parseInt(amount) * 100,
                payment_status: "paid",
                driver_id: driverId,
                user_id: userId,
              }),
            });
          } catch (error) {
            console.log("RIDE_CREATION_ERROR", error);
          }
        }}
        // @ts-ignore
        ref={paystackWebViewRef}
      />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.check} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Booking placed successfully
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you for your booking. Your reservation has been successfully
            placed. Please proceed with your trip.
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/(root)/(tabs)/home");
            }}
            className="mt-5"
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default PaystackPayment;
