//components/WeeklyReportCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Report {
    totalScrobbles: number;
    uniqueArtists: number;
    topArtist: { name: string; };
}

const Stat = ({ icon, value, label }: { icon: any; value: string | number; label: string }) => (
    <View style={styles.statContainer}>
        <Ionicons name={icon} size={28} color="#D92323" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const WeeklyReportCard = ({ report }: { report: Report | null }) => {
    
    if (!report || report.totalScrobbles === 0) {
        return (
            <View style={[styles.card, styles.fallbackCard]}>
                <Ionicons name="musical-notes-outline" size={32} color="#A0A0A0" />
                <Text style={styles.fallbackText}>
                    No listening data for this week's report yet. Keep scrobbling!
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.statsRow}>
                <Stat icon="stats-chart-outline" value={report.totalScrobbles} label="Scrobbles" />
                <Stat icon="people-outline" value={report.uniqueArtists} label="Artists" />
                <Stat icon="star-outline" value={report.topArtist.name} label="Top Artist" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#212121',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
    },
    fallbackCard: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    fallbackText: {
        fontFamily: 'AvenirNextLTPro-Regular',
        color: '#A0A0A0',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statContainer: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontFamily: 'AvenirNextLTPro-Bold',
        fontSize: 18,
        color: '#FFFFFF',
        marginTop: 8,
        textAlign: 'center',
    },
    statLabel: {
        fontFamily: 'AvenirNextLTPro-Regular',
        fontSize: 14,
        color: '#A0A0A0',
        marginTop: 2,
    },
});

export default WeeklyReportCard;
