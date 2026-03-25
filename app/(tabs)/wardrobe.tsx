import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from "react-native";

import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";

import { Metrics } from "@/src/constants/Metrics";
import { Colors } from "@/src/constants/Colors";


const CATEGORIES = [
    { id: '1', name: 'All' },
    { id: '2', name: 'Jacket' },
    { id: '3', name: 'Top' },
    { id: '4', name: 'Bottom' },
    { id: '5', name: 'Dress' },
    { id: '6', name: 'Shoe' },
    { id: '7', name: 'Accessory' },
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
    const [activeHeader, setActiveHeader] = useState('Clothes');
    const [activeCategory, setActiveCategory] = useState('1');

	const filteredItems = activeCategory === '1'
        ? CLOTHING_ITEMS
        : CLOTHING_ITEMS.filter(item => item.categoryId === activeCategory);

    return (
        <ScreenWrapper>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => setActiveHeader('Clothes')}>
                    <Text style={[styles.inactiveHeaderText, activeHeader === 'Clothes' && styles.activeHeaderText]}>Clothes</Text>
                    {activeHeader === 'Clothes' && <View style={styles.underline} />}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveHeader('Outfits')}>
                    <Text style={[styles.inactiveHeaderText, activeHeader === 'Outfits' && styles.activeHeaderText]}>Outfits</Text>
                    {activeHeader === 'Outfits' && <View style={styles.underline} />}
                </TouchableOpacity>
            </View>

			<View style={styles.categoryContainer}>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={CATEGORIES}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.categoryScrollContent}
					renderItem={({ item }) => (
						<TouchableOpacity 
							onPress={() => setActiveCategory(item.id)}
							style={[ 
								styles.inactiveCategoryCircle, 
								activeCategory === item.id && styles.activeCategoryCircle 
							]} 
						>
							<Text style={[
								styles.inactiveCategoryText, 
								activeCategory === item.id && styles.activeCategoryText
							]}>
								{item.name}
							</Text>
						</TouchableOpacity>
					)}
				/>
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
        paddingBottom: 20,
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
        paddingVertical: 5,
		//marginTop: 20,
    	alignItems: 'center',
    	width: '100%',
    },
    categoryScrollContent:
	{
		paddingHorizontal: 20, 
		alignItems: 'center',
		paddingBottom: 15,
		gap: 12,
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
        fontSize: 11,
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