import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from "react-native";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";

import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";


const CATEGORIES = [
    { id: '1', name: 'All'},
    { id: '2', name: 'Jackets'},
    { id: '3', name: 'Tops'},
    { id: '4', name: 'Bottoms'},
    { id: '5', name: 'Dresses'},
];

// MOCK DATA
const CLOTHING_ITEMS = [
    { id: '1', categoryId: '2', name: 'Beyaz Tişört', image: null }, // T-shirts
    { id: '2', categoryId: '2', name: 'Siyah Tişört', image: null }, // T-shirts
    { id: '3', categoryId: '3', name: 'Mavi Kot', image: null },     // Pants
    { id: '4', categoryId: '5', name: 'Nike Air', image: null },    // Shoes
    { id: '5', categoryId: '3', name: 'bluz', image: null },    // Shoes
    // Eğer burası boşsa [], ekranda hiç kutu görünmez!
];

export default function WardrobeScreen()
{
    const [activeHeader, setActiveHeader] = useState('Items');
    const [activeCategory, setActiveCategory] = useState('1');

	const filteredItems = activeCategory === '1'
        ? CLOTHING_ITEMS
        : CLOTHING_ITEMS.filter(item => item.categoryId === activeCategory);

    return (
        <ScreenWrapper>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => setActiveHeader('Items')}>
                    <Text style={[styles.inactiveHeaderText, activeHeader === 'Items' && styles.activeHeaderText]}>Clothes</Text>
                    {activeHeader === 'Items' && <View style={styles.underline} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveHeader('Outfits')}>
                    <Text style={[styles.inactiveHeaderText, activeHeader === 'Outfits' && styles.activeHeaderText]}>Accessories</Text>
                    {activeHeader === 'Outfits' && <View style={styles.underline} />}
                </TouchableOpacity>
            </View>

            <View style={styles.categoryContainer}>
				{CATEGORIES.map((item) => (
					<TouchableOpacity 
						key={item.id}
						onPress={() => setActiveCategory(item.id)}
						style={[ styles.inactiveCategoryCircle, activeCategory === item.id && styles.activeCategoryCircle ]} >
						<Text style={[styles.inactiveCategoryText, activeCategory === item.id && styles.activeCategoryText]}> {item.name} </Text>
					</TouchableOpacity>
				))}
			</View>

            <FlatList
                data={filteredItems}
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
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    headerContainer:
	{
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10, //bunu wrapper a ekleyince üstte boşluk kalıyor
        //paddingBottom: 10,
    },
    inactiveHeaderText:
	{
        fontSize: 18,
        fontWeight: '600',
		color: Colors.inactiveHeaderText,
    },
    activeHeaderText:
	{
        color: Colors.blackShadow,
    },


    underline:
	{
        height: 3,
        backgroundColor: Colors.blackShadow,
        width: '100%',
        marginTop: 4,
        borderRadius: 2,
    },

    categoryContainer:
	{
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
        paddingVertical: 20,
		//marginTop: 10,
		paddingHorizontal: 30,
		width: '100%',
    },
    inactiveCategoryCircle:
	{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.inactiveButton,
        justifyContent: 'center',
        alignItems: 'center',
        //marginRight: 15,
        // Hafif gölge (iOS)
		shadowColor: Colors.blackShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Gölge (Android)
        elevation: 3,
    },
    activeCategoryCircle:
	{
		backgroundColor: Colors.activeButton,

		// bu ikisi ayrı ayrı lazım mı?
        shadowOpacity: 0.4,
        elevation: 3.5,
    },
	inactiveCategoryText:
	{
        fontSize: 12,
        fontWeight: '600',
        color: Colors.inactiveButtonText,
    },
    activeCategoryText:
	{
		color: Colors.activeButtonText,
        
    },


    gridContent:
	{
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    columnWrapper:
	{
        justifyContent: 'flex-start',
        marginBottom: 15,
		gap: 10,
    },
    itemCard:
	{
        width: (Metrics.screenWidth - 50) / 3, // 3 kolon + boşluklar
        height: (Metrics.screenWidth - 50) / 3,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    imagePlaceholder:
	{
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemImage:
	{
        width: '90%',
        height: '90%',
        resizeMode: 'contain',
    }
});