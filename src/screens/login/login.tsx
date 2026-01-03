import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DE BIOMETRIA ---
  const handleBiometry = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return Alert.alert(
        'Aviso', 
        'Biometria não disponível ou não cadastrada neste aparelho.'
      );
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse seu MyFinance',
      fallbackLabel: 'Usar senha',
    });

    if (auth.success) {
      handleLoginSuccess();
    }
  };

  const handleLoginSuccess = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem('@myfinance:logged', 'true');
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Erro ao navegar:', error);
      Alert.alert('Erro', 'Não foi possível acessar a tela principal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* LOGO E CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="payments" size={60} color="#3870d8" />
          </View>

          <Text style={styles.title}>MyFinance</Text>
          <Text style={styles.subtitle}>
            Sua gestão financeira na palma da mão.
          </Text>
        </View>

        {/* BOTÕES DE ACESSO */}
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#3870d8" />
          ) : (
            <>
              {/* BOTÃO DE BIOMETRIA */}
              <TouchableOpacity
                style={styles.biometryBtn}
                onPress={handleBiometry}
                activeOpacity={0.8}
              >
                <Ionicons name="finger-print" size={24} color="#fff" />
                <Text style={styles.biometryText}>Acessar com Biometria</Text>
              </TouchableOpacity>

              {/* BOTÃO DE CONVIDADO */}
              <TouchableOpacity
                style={styles.guestBtn}
                onPress={handleLoginSuccess}
                activeOpacity={0.8}
              >
                <MaterialIcons name="person-outline" size={24} color="#3870d8" />
                <Text style={styles.guestText}>Continuar sem cadastro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footerText}>
          Proteja seus dados com coragem e sabedoria.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  biometryBtn: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 15,
    backgroundColor: '#3870d8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 3,
    shadowColor: '#3870d8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  biometryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestBtn: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3870d8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  guestText: {
    color: '#3870d8',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
});