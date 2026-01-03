import React from 'react';
import { View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Importação das Telas
import HomeScreen from './src/screens/home/home';
import ExpensesScreen from './src/screens/expenses/expenses';
import SummaryScreen from './src/screens/summary/summary';
import FixedBillsScreen from './src/screens/fixedbills/fixedbills';
import InvestmentsScreen from './src/screens/investments/investments';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#3870d8" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false, // Esconde o texto para destacar o ícone
          
          // Estilo da Barra (Container)
          tabBarStyle: {
            position: 'absolute',
            bottom: 0, // Flutua do fundo
            left: 20,
            right: 20,
            elevation: 5, // Sombra Android
            backgroundColor: '#ffffff',
            borderTopStartRadius: 15, // Bordas arredondadas
            borderTopStartRadius: 15, // Bordas arredondadas
            height: 70, // Altura maior para acomodar o ícone flutuante
            shadowColor: '#000', // Sombra iOS
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.1,
            shadowRadius: 3.5,
            borderTopWidth: 0, // Remove linha padrão
          },
        }}
      >

        {/* 2. GASTOS */}
        <Tab.Screen 
          name="Gastos" 
          component={ExpensesScreen} 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
                <MaterialIcons 
                  name="attach-money" 
                  size={30} 
                  color={focused ? '#fff' : '#94a3b8'} 
                />
              </View>
            ),
          }}
        />

        {/* 3. FIXAS */}
        <Tab.Screen 
          name="Fixas" 
          component={FixedBillsScreen} 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
                <MaterialIcons 
                  name="event-note" 
                  size={30} 
                  color={focused ? '#fff' : '#94a3b8'} 
                />
              </View>
            ),
          }}
        />

        {/* 1. HOME */}
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
                <MaterialIcons 
                  name="home" 
                  size={30} 
                  color={focused ? '#fff' : '#94a3b8'} 
                />
              </View>
            ),
          }}
        />

        {/* 4. RESUMO */}
        <Tab.Screen 
          name="Resumo" 
          component={SummaryScreen} 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
                <MaterialIcons 
                  name="pie-chart" 
                  size={30} 
                  color={focused ? '#fff' : '#94a3b8'} 
                />
              </View>
            ),
          }}
        />

        {/* 4. INVESTIMENTOS */}
        <Tab.Screen 
          name="Investimentos" 
          component={InvestmentsScreen} 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={focused ? styles.iconFocused : styles.iconUnfocused}>
                <MaterialIcons 
                  name="trending-up" 
                  size={30} 
                  color={focused ? '#fff' : '#94a3b8'} 
                />
              </View>
            ),
          }}
        />

      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Estilos locais para os ícones
const styles = {
  iconFocused: {
    width: 55,
    height: 55,
    backgroundColor: '#3870d8', // Cor de destaque (Azul do App)
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40, // FAZ O ÍCONE SUBIR (Efeito sobreposto)
    // Sombra para o botão flutuante
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
};