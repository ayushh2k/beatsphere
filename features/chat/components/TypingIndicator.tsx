/**
 * Animated typing indicator component.
 * Shows when other users are typing.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import type { TypingIndicator as TypingIndicatorType } from '../types';

interface TypingIndicatorProps {
  typingIndicator: TypingIndicatorType;
}

export default function TypingIndicator({ typingIndicator }: TypingIndicatorProps) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: typingIndicator.isTyping ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [typingIndicator.isTyping, animValue]);

  return (
    <Animated.View
      style={[
        styles.typingIndicatorContainer,
        {
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.typingIndicatorText}>{typingIndicator.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  typingIndicatorContainer: {
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#181818',
  },
  typingIndicatorText: { color: '#A0A0A0', fontStyle: 'italic' },
});
