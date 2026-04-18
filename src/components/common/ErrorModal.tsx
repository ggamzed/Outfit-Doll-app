import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/src/constants/Colors';

interface ErrorModalProps {
    visible: boolean;
    message: string;
    onClose: () => void;
}

export const ErrorModal = ({ visible, message, onClose }: ErrorModalProps) => {
    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.alertBox}>
                    <Text style={styles.title}>Oops! 🛠️</Text>
                    <Text style={styles.message}>{message}</Text>
                    
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertBox: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'red',
    },
    message: {
        textAlign: 'center',
        color: '#444',
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.activeButton || '#000',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
    }
});