// components/RemappedProgressBar.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

interface ProgressBarProps {
    current: number;
    total: number;
}

const RemappedProgressBar = ({ current, total }: ProgressBarProps) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, i) => (
                <View key={i} style={styles.segment}>
                    {i < current ? (
                        <View style={styles.filled} />
                    ) : i === current ? (
                        <MotiView
                            from={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{
                                type: 'timing',
                                duration: 8000,
                            }}
                            style={styles.filled}
                        />
                    ) : null}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        gap: 4,
    },
    segment: {
        flex: 1,
        height: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    filled: {
        height: '100%',
        backgroundColor: '#D92323',
        borderRadius: 2,
    },
});

export default RemappedProgressBar;
