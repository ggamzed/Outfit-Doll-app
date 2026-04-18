import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OutfitLibraryProvider } from "@/src/state/OutfitLibraryContext";
import { OutfitProvider } from "@/src/state/OutfitContext";
import { UserWardrobeItemsProvider } from "@/src/state/UserWardrobeItemsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <OutfitProvider>
        <OutfitLibraryProvider>
          <UserWardrobeItemsProvider>
            <Slot />
          </UserWardrobeItemsProvider>
        </OutfitLibraryProvider>
      </OutfitProvider>
    </SafeAreaProvider>
  );
}