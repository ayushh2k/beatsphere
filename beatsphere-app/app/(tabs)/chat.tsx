import React from 'react'
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Chat = () => {
    return (
      <SafeAreaView className="bg-primary flex-1 items-center justify-center">
        <Text className='text-xl font-aregular color-green'> Chat </Text>
      </SafeAreaView>
    )
}

export default Chat