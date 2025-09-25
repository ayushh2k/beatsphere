// components/LocationConsentModal.tsx

import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const LocationConsentModal = ({ visible, onAccept, onDecline }: { visible: boolean; onAccept: () => void; onDecline: () => void; }) => {
  return (
    <Modal 
      visible={visible} 
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <Ionicons name="location-sharp" size={70} color="#D92323" style={styles.icon} />
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            BeatSphere uses your location to show you what others are listening to nearby and to place you on the global map for others to see.
          </Text>
          
          <View style={styles.privacyInfoContainer}>
            <Ionicons name="shield-checkmark-outline" size={30} color="#50E3C2" />
            <Text style={styles.privacyInfo}>
              <Text style={{ fontFamily: 'AvenirNextLTPro-Bold' }}>Your privacy is key.</Text> Your precise location is never stored or shared, only a generalized area.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.buttonText}>I Understand and Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    padding: 24,
  },
  mainContent: {
    alignItems: 'center',
    paddingTop: '20%',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  privacyInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  privacyInfo: {
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 14,
    color: '#B3B3B3',
    lineHeight: 21,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#D92323',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: "#D92323",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontFamily: 'AvenirNextLTPro-Bold',
    color: '#FFFFFF',
    fontSize: 16,
  },
  declineButton: {
      marginTop: 12,
      paddingVertical: 16,
      alignItems: 'center',
  },
  declineButtonText: {
      fontFamily: 'AvenirNextLTPro-Regular',
      color: '#A0A0A0',
      fontSize: 16,
  }
});

export default LocationConsentModal;

