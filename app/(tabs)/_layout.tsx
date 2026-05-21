import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { AdMobBanner } from '../../src/components/ads/AdMobBanner';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  activeName,
  focused,
  color,
}: {
  name: IconName;
  activeName: IconName;
  focused: boolean;
  color: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={focused ? activeName : name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#F28C28',
          tabBarInactiveTintColor: '#94A3B8',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            elevation: 16,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name="home-outline"
                activeName="home"
                focused={focused}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Challenges',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name="flash-outline"
                activeName="flash"
                focused={focused}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name="trophy-outline"
                activeName="trophy"
                focused={focused}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name="person-outline"
                activeName="person"
                focused={focused}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen name="activities" options={{ href: null }} />
        <Tabs.Screen name="results" options={{ href: null }} />
        <Tabs.Screen name="sqlite-test" options={{ href: null }} />
        <Tabs.Screen name="auth" options={{ href: null }} />
      </Tabs>
      <AdMobBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(242,140,40,0.16)',
  },
});
