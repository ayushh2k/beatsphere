import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Home = () => {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Text className='text-xl font-aregular color-green'> Home </Text>
      </SafeAreaView>
    )
}

export default Home
