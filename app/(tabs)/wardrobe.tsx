import React, { useState } from 'react';
import { 
    StyleSheet, 
    Text, 
    View, 
    FlatList, 
    TouchableOpacity, 
    Image, 
    
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";

// Sahte Veri Seti (Mühendislikte Mock Data diyoruz)
const CATEGORIES = [
    { id: '1', name: 'All', icon: '✨' },
    { id: '2', name: 'T-shirts', icon: '👕' },
    { id: '3', name: 'Pants', icon: '👖' },
    { id: '4', name: 'Dresses', icon: '👗' },
    { id: '5', name: 'Shoes', icon: '👟' },
];

const CLOTHING_ITEMS = Array.from({ length: 12 }).map((_, index) => ({
    id: String(index),
    image: null, // Buraya gerçek resim linkleri gelecek
}));

export default function WardrobeScreen() {
    const [activeTab, setActiveTab] = useState('Items');
    const [selectedCategory, setSelectedCategory] = useState('1');

    return (
        <SafeAreaView style={styles.container}>
            {/* 1. HEADER SEKMELERİ */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => setActiveTab('Items')}>
                    <Text style={[styles.tabText, activeTab === 'Items' && styles.activeTabText]}>Items</Text>
                    {activeTab === 'Items' && <View style={styles.underline} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab('Outfits')}>
                    <Text style={[styles.tabText, activeTab === 'Outfits' && styles.activeTabText]}>Outfits</Text>
                    {activeTab === 'Outfits' && <View style={styles.underline} />}
                </TouchableOpacity>
            </View>

            {/* 2. YATAY KATEGORİ LİSTESİ */}
            <View style={styles.categoryWrapper}>
                <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            onPress={() => setSelectedCategory(item.id)}
                            style={[
                                styles.categoryCircle, 
                                selectedCategory === item.id && styles.selectedCategoryCircle
                            ]}
                        >
                            <Text style={styles.categoryIcon}>{item.icon}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* 3. 3'LÜ IZGARA (GRID) LİSTESİ */}
            <FlatList
                data={CLOTHING_ITEMS}
                numColumns={3}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.itemCard}>
                        {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Text style={{ color: '#ccc', fontSize: 24 }}>+</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDE2F3', // Görseldeki pembe tonu
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingBottom: 10,
    },
    tabText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#888',
    },
    activeTabText: {
        color: '#000',
    },
    underline: {
        height: 3,
        backgroundColor: '#000',
        width: '100%',
        marginTop: 4,
        borderRadius: 2,
    },
    categoryWrapper: {
        paddingVertical: 20,
        paddingLeft: 15,
    },
    categoryCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        // Hafif gölge (iOS)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Gölge (Android)
        elevation: 3,
    },
    selectedCategoryCircle: {
        borderWidth: 2,
        borderColor: '#000',
    },
    categoryIcon: {
        fontSize: 24,
    },
    gridContent: {
        paddingHorizontal: 15,
        paddingBottom: 100, // Tab bar'ın altında kalmasın diye
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    itemCard: {
        width: (Metrics.screenWidth - 50) / 3, // 3 kolon + boşluklar
        height: (Metrics.screenWidth - 50) / 3,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemImage: {
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    }
});