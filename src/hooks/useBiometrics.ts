import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export async function handleBiometricAuth() {
  // 1. Verifica se o hardware suporta biometria
  const isCompatible = await LocalAuthentication.hasHardwareAsync();
  if (!isCompatible) {
    return Alert.alert('Erro', 'Seu dispositivo não suporta biometria.');
  }

  // 2. Verifica se há biometrias cadastradas
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) {
    return Alert.alert('Aviso', 'Nenhuma biometria cadastrada no dispositivo.');
  }

  // 3. Executa a autenticação
  const auth = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Autenticação Biométrica',
    fallbackLabel: 'Usar senha',
    disableDeviceFallback: false,
  });

  if (auth.success) {
    // Usuário autenticado com sucesso
    return true;
  } else {
    return false;
  }
}