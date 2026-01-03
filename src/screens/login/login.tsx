import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Image, StatusBar, Alert, ActivityIndicator 
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);

  // --- CONFIGURAÇÃO GOOGLE LOGIN ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Substitua pelos IDs que você gerou no Google Cloud
    iosClientId: 'GOOGLE_IOS_ID.apps.googleusercontent.com',
    androidClientId: 'GOOGLE_ANDROID_ID.apps.googleusercontent.com',
    webClientId: 'GOOGLE_WEB_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleLoginSuccess();
    }
  }, [response]);

  // --- LÓGICA DE BIOMETRIA ---
  const handleBiometry = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return Alert.alert('Erro', 'Biometria não disponível ou não cadastrada.');
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
    // Salva que o usuário está logado
    await AsyncStorage.setItem('@myfinance:logged', 'true');
    setLoading(false);
    navigation.replace('MainTabs'); // Navega para a Home (ajuste o nome se necessário)
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* LOGO E BOAS-VINDAS */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="payments" size={60} color="#3870d8" />
          </View>
          <Text style={styles.title}>MyFinance</Text>
          <Text style={styles.subtitle}>Sua gestão financeira na palma da mão.</Text>
        </View>

        {/* BOTÕES DE LOGIN */}
        <View style={styles.buttonContainer}>
          
          {loading ? (
            <ActivityIndicator size="large" color="#3870d8" />
          ) : (
            <>
              {/* GOOGLE LOGIN */}
              <TouchableOpacity 
                style={styles.googleBtn} 
                disabled={!request} 
                onPress={() => promptAsync()}
              >
                <FontAwesome5 name="google" size={20} color="#fff" />
                <Text style={styles.googleBtnText}>Entrar com Google</Text>
              </TouchableOpacity>

              {/* BIOMETRIA */}
              <TouchableOpacity style={styles.biometryBtn} onPress={handleBiometry}>
                <Ionicons name="finger-print" size={24} color="#3870d8" />
                <Text style={styles.biometryText}>Acessar com Biometria</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        <Text style={styles.footerText}>Proteja seus dados com coragem e sabedoria.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'space-around', alignItems: 'center' },
  header: { alignItems: 'center' },
  logoCircle: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: '#f1f5f9', justifyContent: 'center', 
    alignItems: 'center', marginBottom: 20 
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10 },
  buttonContainer: { width: '100%', gap: 15 },
  googleBtn: { 
    backgroundColor: '#3870d8', flexDirection: 'row', 
    height: 55, borderRadius: 15, justifyContent: 'center', 
    alignItems: 'center', gap: 12, elevation: 3 
  },
  googleBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  biometryBtn: { 
    flexDirection: 'row', height: 55, borderRadius: 15, 
    borderWidth: 1, borderColor: '#3870d8', justifyContent: 'center', 
    alignItems: 'center', gap: 12 
  },
  biometryText: { color: '#3870d8', fontSize: 16, fontWeight: '600' },
  footerText: { color: '#94a3b8', fontSize: 12, textAlign: 'center' }
});