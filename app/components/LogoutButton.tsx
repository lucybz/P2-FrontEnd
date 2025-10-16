import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from '../auth/auth';

/**
 * Example logout component that can be added to any screen
 * 
 * Usage:
 * import LogoutButton from './components/LogoutButton';
 * 
 * <LogoutButton />
 */
export default function LogoutButton() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Success', 'Logged out successfully');
              navigation.navigate('login');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Button title="Logout" onPress={handleLogout} color="#FF5733" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});
