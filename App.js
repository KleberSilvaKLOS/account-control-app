import React from 'react';
import { StatusBar } from 'react-native'; // Usando o nativo para máxima estabilidade
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import ExpensesScreen from './src/screens/expenses/expenses';
import SummaryScreen from './src/screens/summary/summary';
import FixedBillsScreen from './src/screens/fixedbills/fixedbills';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* No Android nativo, usamos barStyle em vez de style */}
      <StatusBar Style="light-content" backgroundColor="transparent" translucent={true} />
      
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#3870d8ff',
            borderTopColor: '#182e22',
            height: 65,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#ffffffff',
          tabBarInactiveTintColor: '#94a3b8',
        }}
      >
        <Tab.Screen 
          name="Início" 
          component={ExpensesScreen} 
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={26} color={color} />
            )
          }}
        />

        <Tab.Screen 
          name="Resumo" // Ou "Investir" se preferir manter o nome antigo
          component={SummaryScreen} 
          options={{
            tabBarIcon: ({ color }) => (
            <MaterialIcons name="pie-chart" size={26} color={color} />
            )
          }}
        />

        <Tab.Screen 
          name="Fixas" // Ou "Investir" se preferir manter o nome antigo
          component={FixedBillsScreen} 
          options={{
            tabBarIcon: ({ color }) => (
            <MaterialIcons name="receipt-long" size={26} color={color} />
            )
          }}
        />

      </Tab.Navigator>
    </NavigationContainer>
  );
}