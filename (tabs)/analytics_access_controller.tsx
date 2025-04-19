import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminAnalytics from './admin_analytics';
import Analytics from './analytics';

const AnalyticsRouter = () => {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'admin' | 'personal'>('admin');

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const storedRoleId = await AsyncStorage.getItem('roleId');
        setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
      } catch (error) {
        console.error('Error fetching roleId:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleId();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const canAccessBoth = [2, 3, 4, 8].includes(roleId!);
  const isAdmin = [1, 2, 3, 4, 8].includes(roleId!);

  return (
    <View style={{ flex: 1 }}>
      {canAccessBoth && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 12, backgroundColor: '#f1f5f9' }}>
          <TouchableOpacity
            style={{
              backgroundColor: activeView === 'admin' ? '#4f46e5' : '#cbd5e1',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={() => setActiveView('admin')}
          >
            <Text style={{ color: activeView === 'admin' ? '#fff' : '#1e293b', fontWeight: 'bold' }}>
              Company Analytics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: activeView === 'personal' ? '#4f46e5' : '#cbd5e1',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={() => setActiveView('personal')}
          >
            <Text style={{ color: activeView === 'personal' ? '#fff' : '#1e293b', fontWeight: 'bold' }}>
              My Analytics
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Show only Admin Analytics if the role is admin and doesn't qualify for both */}
      {!canAccessBoth && isAdmin && <AdminAnalytics />}

      {/* Show appropriate view if user has both options */}
      {canAccessBoth && (activeView === 'admin' ? <AdminAnalytics /> : <Analytics />)}

      {/* Fallback to Analytics for normal users */}
      {!isAdmin && <Analytics />}
    </View>
  );
};

export default AnalyticsRouter;
