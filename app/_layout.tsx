import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot } from "expo-router";
import { OutfitProvider } from "@/src/state/OutfitContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OutfitProvider>
        <Slot />
      </OutfitProvider>
    </SafeAreaProvider>
  );
}