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
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function LoginScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [inputPin, setInputPin] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      checkPinStatus();
      setInputPin('');
    }, [])
  );

  const checkPinStatus = async () => {
    const savedPin = await AsyncStorage.getItem('@myfinance:pin');
    setHasPin(!!savedPin);
  };

  const handlePinPress = (num: string) => {
    if (inputPin.length < 6) {
      setInputPin(inputPin + num);
    }
  };

  const handleDelete = () => {
    setInputPin(inputPin.slice(0, -1));
  };

  const handleManualLogin = () => {
    if (inputPin.length < 4) {
      Alert.alert("Aviso", "O PIN deve ter pelo menos 4 dígitos.");
      return;
    }
    verifyPin(inputPin);
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

  const handleBiometry = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      return Alert.alert('Aviso', 'Biometria não disponível.');
    }

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse seu MyFinance',
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="payments" size={50} color="#3870d8" />
          </View>
          <Text style={styles.title}>MyFinance</Text>
        </View>

        <View style={styles.authContainer}>
          {hasPin && (
            <View style={styles.pinArea}>
              <Text style={styles.pinLabel}>Digite seu PIN</Text>
              <View style={styles.dotsRow}>
                {[1, 2, 3, 4, 5, 6].map((_, i) => (
                  <View key={i} style={[styles.dot, inputPin.length > i && styles.dotFilled]} />
                ))}
              </View>

              <View style={styles.numPad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handlePinPress(num)}>
                    <Text style={styles.numText}>{num}</Text>
                  </TouchableOpacity>
                ))}
                
                {/* Botão Apagar */}
                <TouchableOpacity style={styles.numBtn} onPress={handleDelete}>
                  <MaterialIcons name="backspace" size={24} color="#64748b" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.numBtn} onPress={() => handlePinPress('0')}>
                  <Text style={styles.numText}>0</Text>
                </TouchableOpacity>

                {/* Botão Enter */}
                <TouchableOpacity style={[styles.numBtn, styles.enterBtn]} onPress={handleManualLogin}>
                  <MaterialIcons name="check" size={30} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.bioLink} onPress={handleBiometry}>
                <Ionicons name="finger-print" size={20} color="#3870d8" />
                <Text style={styles.bioLinkText}>Usar Biometria</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* BOTÕES DE CADASTRO (Sempre visíveis ou para novos usuários) */}
          <View style={styles.registrationArea}>
            {!hasPin && <Text style={styles.welcomeText}>Bem-vindo! Comece agora:</Text>}
            
            <TouchableOpacity style={styles.emailBtn} onPress={() => navigation.navigate('email')}>
              <MaterialIcons name="mail-outline" size={22} color="#3870d8" />
              <Text style={styles.emailText}>{hasPin ? "Trocar conta / Novo PIN" : "Cadastrar PIN por E-mail"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestBtn} onPress={handleLoginSuccess}>
              <Text style={styles.guestText}>Entrar como Convidado</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Proteja seus dados com coragem e sabedoria.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  authContainer: { width: '100%', alignItems: 'center' },
  pinArea: { alignItems: 'center', width: '100%', marginBottom: 30 },
  pinLabel: { fontSize: 16, color: '#64748b', marginBottom: 15, fontWeight: '500' },
  dotsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#cbd5e1' },
  dotFilled: { backgroundColor: '#3870d8', borderColor: '#3870d8' },
  numPad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280, gap: 15 },
  numBtn: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  enterBtn: { backgroundColor: '#3870d8' },
  numText: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  bioLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  bioLinkText: { color: '#3870d8', fontWeight: '600' },
  registrationArea: { width: '100%', gap: 12, marginTop: 10 },
  welcomeText: { textAlign: 'center', color: '#64748b', marginBottom: 10 },
  emailBtn: { flexDirection: 'row', height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', gap: 10 },
  emailText: { color: '#3870d8', fontWeight: '600' },
  guestBtn: { height: 50, justifyContent: 'center', alignItems: 'center' },
  guestText: { color: '#94a3b8', fontSize: 14 },
  footerText: { color: '#cbd5e1', fontSize: 11, marginBottom: 10 },
});