import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  Alert, ActivityIndicator 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function PinCreateScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSavePin = async () => {
    if (pin.length < 4) {
      return Alert.alert("PIN Curto", "Por favor, defina um PIN de pelo menos 4 dígitos.");
    }

    setLoading(true);
    try {
      // Salva o PIN no armazenamento local
      await AsyncStorage.setItem('@myfinance:pin', pin);
      // Salva que o usuário está logado
      await AsyncStorage.setItem('@myfinance:logged', 'true');

      Alert.alert(
        "Sucesso!", 
        "Seu PIN foi cadastrado com coragem e sabedoria.",
        [{ text: "Entrar no App", onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar seu PIN.");
    } finally {
      setLoading(false);
    }
  };

  // Função para gerenciar o teclado numérico
  const handlePress = (num: string) => {
    if (pin.length < 6) setPin(pin + num);
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="lock-outline" size={50} color="#3870d8" />
          </View>
          <Text style={styles.title}>Crie seu PIN</Text>
          <Text style={styles.subtitle}>
            Defina uma senha numérica para proteger seus dados financeiros.
          </Text>
        </View>

        {/* VISUALIZAÇÃO DOS DÍGITOS */}
        <View style={styles.pinDisplay}>
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                pin.length > index && styles.dotFilled
              ]} 
            />
          ))}
        </View>

        {/* TECLADO NUMÉRICO CUSTOMIZADO */}
        <View style={styles.keyboard}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0'].map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.key} 
              onPress={() => item !== '' && handlePress(item)}
              disabled={item === ''}
            >
              <Text style={styles.keyText}>{item}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.key} onPress={handleDelete}>
            <MaterialIcons name="backspace" size={24} color="#334155" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, pin.length < 4 && styles.buttonDisabled]} 
          onPress={handleSavePin}
          disabled={pin.length < 4 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirmar PIN</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  pinDisplay: { flexDirection: 'row', gap: 15, marginBottom: 50 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#e2e8f0' },
  dotFilled: { backgroundColor: '#3870d8', borderColor: '#3870d8' },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center' },
  key: { width: '30%', height: 70, justifyContent: 'center', alignItems: 'center' },
  keyText: { fontSize: 28, fontWeight: '600', color: '#334155' },
  button: { backgroundColor: '#3870d8', width: '100%', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});