import React from 'react'
import { Text, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Profile = () => {
    return (
        <SafeAreaView className="bg-primary flex-1 items-center justify-center">
            <Text className='text-xl font-aregular color-green'> Profile Page </Text>
        </SafeAreaView>
    )
}

export default Profile