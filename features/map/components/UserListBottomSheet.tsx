/**
 * Bottom sheet displaying list of nearby users.
 */

import React, { forwardRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { UserCard } from '@/components/cards';
import type { UserLocation } from '../types';

interface UserListBottomSheetProps {
  visibleUsers: UserLocation[];
  snapPoints: string[];
  title: string;
  onFlyToUser: (user: UserLocation) => void;
}

const UserListBottomSheet = forwardRef<BottomSheet, UserListBottomSheetProps>(
  ({ visibleUsers, snapPoints, title, onFlyToUser }, ref) => {
    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        backgroundStyle={styles.bottomSheet}
        handleIndicatorStyle={{ backgroundColor: '#4A4A4A' }}
        enableContentPanningGesture={true}
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>{title}</Text>
        </View>
        <BottomSheetFlatList
          data={visibleUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} onFlyTo={() => onFlyToUser(item)} />}
          contentContainerStyle={styles.bottomSheetContent}
        />
      </BottomSheet>
    );
  }
);

UserListBottomSheet.displayName = 'UserListBottomSheet';

const styles = StyleSheet.create({
  bottomSheet: { backgroundColor: '#181818' },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  bottomSheetTitle: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  bottomSheetContent: { padding: 16 },
});

export default UserListBottomSheet;
