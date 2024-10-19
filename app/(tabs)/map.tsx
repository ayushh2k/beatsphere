import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Map from '@/components/Map';

const MapScreen = () => {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Map />
      </SafeAreaView>
    )
}

export default MapScreen
