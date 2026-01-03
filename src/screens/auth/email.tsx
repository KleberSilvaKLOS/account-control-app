import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase'; 
import { sendPasswordResetEmail } from 'firebase/auth'; 

export default function EmailScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!email.includes('@')) {
      return Alert.alert("Erro", "Por favor, insira um e-mail válido.");
    }

    setLoading(true);
    try {
      // Tenta enviar o e-mail de redefinição como verificação
      await sendPasswordResetEmail(auth, email);
      
      Alert.alert(
        "Verificação Enviada", 
        "Enviamos um link para o seu e-mail. Após validar, você poderá criar seu PIN.",
        [{ text: "OK", onPress: () => navigation.navigate('PinCreate') }]
      );
    } catch (error: any) {
      // DIAGNÓSTICO DE ERRO:
      console.log("ERRO FIREBASE:", error.code);
      
      // Criamos mensagens amigáveis baseadas no código do erro
      let errorMessage = "Não foi possível enviar o e-mail.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Este e-mail não está cadastrado. No Firebase, o reset de senha só funciona para e-mails que já existem na lista de usuários.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "O formato do e-mail é inválido.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "O provedor de E-mail/Senha não está ativado no Console do Firebase.";
      }

      Alert.alert("Erro", `${errorMessage}\n\n(Código: ${error.code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name="security" size={80} color="#3870d8" />
      <Text style={styles.title}>Vincular E-mail</Text>
      <Text style={styles.subtitle}>Digite seu e-mail para receber o código de segurança e criar seu PIN.</Text>

      <TextInput 
        style={styles.input}
        placeholder="seu@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyEmail} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar Código</Text>}
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ marginTop: 20 }} 
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Voltar ao Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginVertical: 20 },
  input: { width: '100%', height: 60, backgroundColor: '#f1f5f9', borderRadius: 15, paddingHorizontal: 20, fontSize: 16, marginBottom: 20 },
  button: { width: '100%', height: 60, backgroundColor: '#3870d8', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});