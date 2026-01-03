import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTAÇÃO DO TEMA
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import HomeScreen from './src/screens/home/home';
import ExpensesScreen from './src/screens/expenses/expenses';
import SummaryScreen from './src/screens/summary/summary';
import FixedBillsScreen from './src/screens/fixedbills/fixedbills';
import InvestmentsScreen from './src/screens/investments/investments';
import LoginScreen from './src/screens/login/login';
import EmailScreen from './src/screens/auth/email'; 
import PinCreateScreen from './src/screens/auth/pinCreate';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  iconFocused: {
    width: 55,
    height: 55,
    backgroundColor: '#3870d8',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    elevation: 10,
    shadowColor: '#3870d8',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  iconUnfocused: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

function TabNavigator() {
  const { isDark } = useTheme(); // Hook do tema

  return (
    <Tab.Navigator
      initialRouteName="Home" 
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: - 30,
          left: 20,
          right: 20,
          elevation: 5,
          backgroundColor: isDark ? '#1e293b' : '#ffffff', // COR DINÂMICA
          borderRadius: 20,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 3.5,
          borderTopWidth: 0,
          marginBottom: 10,
        },
      }}
    >
      <Tab.Screen 
        name="Gastos" 
        component={ExpensesScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
              <MaterialIcons name="attach-money" size={30} color={focused ? '#fff' : (isDark ? '#64748b' : '#94a3b8')} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Fixas" 
        component={FixedBillsScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
              <MaterialIcons name="event-note" size={30} color={focused ? '#fff' : (isDark ? '#64748b' : '#94a3b8')} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
              <MaterialIcons name="home" size={30} color={focused ? '#fff' : (isDark ? '#64748b' : '#94a3b8')} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Resumo" 
        component={SummaryScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
              <MaterialIcons name="pie-chart" size={30} color={focused ? '#fff' : (isDark ? '#64748b' : '#94a3b8')} />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Investimentos" 
        component={InvestmentsScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
              <MaterialIcons name="trending-up" size={30} color={focused ? '#fff' : (isDark ? '#64748b' : '#94a3b8')} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// COMPONENTE PARA WRAPPER DO TEMA
function MainApp() {
  const [isLogged, setIsLogged] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    async function checkLogin() {
      try {
        const logged = await AsyncStorage.getItem('@myfinance:logged');
        const savedPin = await AsyncStorage.getItem('@myfinance:pin');
        setIsLogged(logged === 'true' && savedPin !== null);
      } catch (e) {
        setIsLogged(false);
      }
    }
    checkLogin();
  }, []);

  if (isLogged === null) return null;

  return (
    <NavigationContainer>
      {/* STATUSBAR TAMBÉM MUDA */}
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#0f172a" : "#3870d8"} />
      <Stack.Navigator 
        initialRouteName={isLogged ? 'MainTabs' : 'Login'} 
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="email" component={EmailScreen} />
        <Stack.Screen name="PinCreate" component={PinCreateScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}