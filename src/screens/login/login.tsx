import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image, // Adicionado para usar o icon.png
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [inputPin, setInputPin] = useState('');

  const theme = {
    background: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    subtext: isDark ? '#94a3b8' : '#64748b',
    card: isDark ? '#1e293b' : '#f1f5f9',
    numBtn: isDark ? '#1e293b' : '#f8fafc',
    dotBorder: isDark ? '#334155' : '#cbd5e1',
    inputBorder: isDark ? '#334155' : '#e2e8f0',
  };

  useFocusEffect(
    React.useCallback(() => {
      checkPinStatus();
      setInputPin('');
    }, [])
  );

  const checkPinStatus = async () => {
    const savedPin = await AsyncStorage.getItem('@myfinance:pin');
    const pinExists = !!savedPin;
    setHasPin(pinExists);

    if (pinExists) {
      setTimeout(() => {
        handleBiometry(true);
      }, 500);
    }
  };

  const handlePinPress = (num: string) => {
    // Ajustado para aceitar apenas 4 dígitos, conforme a regra de negócio do seu app
    if (inputPin.length < 4) {
      const newPin = inputPin + num;
      setInputPin(newPin);
      
      // Verificação automática ao chegar no 4º dígito
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setInputPin(inputPin.slice(0, -1));
  };

  const verifyPin = async (pinAttempt: string) => {
    const savedPin = await AsyncStorage.getItem('@myfinance:pin');
    if (pinAttempt === savedPin) {
      handleLoginSuccess();
    } else {
      Alert.alert("Erro", "PIN incorreto");
      setInputPin('');
    }
  };

  const handleManualLogin = () => {
    if (inputPin.length < 4) {
      Alert.alert("Aviso", "O PIN deve ter 4 dígitos.");
      return;
    }
    verifyPin(inputPin);
  };

  const handleBiometry = async (isAuto = false) => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      if (!isAuto) Alert.alert('Aviso', 'Biometria não disponível.');
      return;
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse seu MyFinances',
      fallbackLabel: 'Usar PIN',
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
      Alert.alert('Erro', 'Não foi possível acessar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: theme.card }]}>
            {/* Trocado MaterialIcons pela sua Image personalizada */}
            <Image 
              source={require('./icon.png')} 
              style={styles.logoImage} 
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>MyFinances</Text>
        </View>

        <View style={styles.authContainer}>
          {hasPin && (
            <View style={styles.pinArea}>
              <Text style={[styles.pinLabel, { color: theme.subtext }]}>Digite seu PIN</Text>
              <View style={styles.dotsRow}>
                {[1, 2, 3, 4].map((_, i) => ( // Ajustado para 4 pontos
                  <View 
                    key={i} 
                    style={[
                      styles.dot, 
                      { borderColor: theme.dotBorder }, 
                      inputPin.length > i && styles.dotFilled
                    ]} 
                  />
                ))}
              </View>

              <View style={styles.numPad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <TouchableOpacity 
                    key={num} 
                    style={[styles.numBtn, { backgroundColor: theme.numBtn }]} 
                    onPress={() => handlePinPress(num)}
                  >
                    <Text style={[styles.numText, { color: theme.text }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity style={[styles.numBtn, { backgroundColor: theme.numBtn }]} onPress={handleDelete}>
                  <MaterialIcons name="backspace" size={24} color={theme.subtext} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.numBtn, { backgroundColor: theme.numBtn }]} onPress={() => handlePinPress('0')}>
                  <Text style={[styles.numText, { color: theme.text }]}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.numBtn, styles.enterBtn]} onPress={handleManualLogin}>
                  <MaterialIcons name="check" size={30} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.bioLink} onPress={() => handleBiometry(false)}>
                <Ionicons name="finger-print" size={20} color="#3870d8" />
                <Text style={styles.bioLinkText}>Usar Biometria</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.registrationArea}>
            {!hasPin && <Text style={[styles.welcomeText, { color: theme.subtext }]}>Bem-vindo! Comece agora:</Text>}
            
            <TouchableOpacity 
              style={[styles.emailBtn, { borderColor: theme.inputBorder }]} 
              onPress={() => navigation.navigate('email')}
            >
              <MaterialIcons name="mail-outline" size={22} color="#3870d8" />
              <Text style={styles.emailText}>{hasPin ? "Trocar conta / Novo PIN" : "Cadastrar PIN por E-mail"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestBtn} onPress={handleLoginSuccess}>
              <Text style={[styles.guestText, { color: theme.subtext }]}>Entrar como Convidado</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.footerText, { color: theme.subtext }]}>Proteja seus dados com coragem e sabedoria.</Text>
      </View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3870d8" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20 },
  logoCircle: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10,
    overflow: 'hidden' // Garante que a imagem não saia do círculo
  },
  logoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain'
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  authContainer: { width: '100%', alignItems: 'center' },
  pinArea: { alignItems: 'center', width: '100%', marginBottom: 30 },
  pinLabel: { fontSize: 16, marginBottom: 15, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  dotFilled: { backgroundColor: '#3870d8', borderColor: '#3870d8' },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280, gap: 15 },
  numBtn: { width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  enterBtn: { backgroundColor: '#3870d8' },
  numText: { fontSize: 22, fontWeight: 'bold' },
  bioLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  bioLinkText: { color: '#3870d8', fontWeight: '600' },
  registrationArea: { width: '100%', gap: 12, marginTop: 10 },
  welcomeText: { textAlign: 'center', marginBottom: 10 },
  emailBtn: { flexDirection: 'row', height: 50, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emailText: { color: '#3870d8', fontWeight: '600' },
  guestBtn: { height: 50, justifyContent: 'center', alignItems: 'center' },
  guestText: { fontSize: 14 },
  footerText: { fontSize: 11, marginBottom: 10 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});