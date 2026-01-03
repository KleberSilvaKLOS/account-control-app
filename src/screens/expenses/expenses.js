import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Keyboard, Platform, StatusBar, Alert, Modal, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lista de sugestões para o autocomplete
const SUGGESTIONS_LIST = [
  'Supermercado', 'Padaria', 'Restaurante', 'Combustível', 
  'Uber / Transporte', 'Aluguel', 'Conta de Luz', 'Conta de Água', 
  'Internet', 'Salário', 'Freelance', 'Investimento', 'Lazer', 
  'Farmácia', 'Academia', 'Manutenção Bike'
];

export default function ExpensesScreen() {
  const [list, setList] = useState([]);
  const [balance, setBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  // Controle do Modal Lateral
  const [modalVisible, setModalVisible] = useState(false);

  // Estados dos Inputs
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState('expense'); 
  
  // Estados do Autocomplete
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotals(list);
  }, [list]);

  // Lógica do Autocomplete
  const handleDescriptionChange = (text) => {
    setDescription(text);
    if (text.length > 0) {
      const filtered = SUGGESTIONS_LIST.filter(item => 
        item.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setDescription(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  async function loadData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:transactions');
      if (jsonValue != null) setList(JSON.parse(jsonValue));
    } catch (e) { console.log(e); }
  }

  async function saveData(newList) {
    try {
      const jsonValue = JSON.stringify(newList);
      await AsyncStorage.setItem('@myfinance:transactions', jsonValue);
    } catch (e) { console.log(e); }
  }

  function calculateTotals(currentList) {
    let total = 0, income = 0, expense = 0;
    currentList.forEach((item) => {
      const val = parseFloat(item.value);
      if (item.type === 'income') { total += val; income += val; } 
      else { total -= val; expense += val; }
    });
    setBalance(total);
    setTotalIncome(income);
    setTotalExpense(expense);
  }

  function handleAdd() {
    if (description === '' || value === '') {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    const newValue = parseFloat(value.replace(',', '.'));
    const newTransaction = {
      id: String(new Date().getTime()),
      description: description,
      value: newValue,
      type: type,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const newList = [newTransaction, ...list];
    setList(newList);
    saveData(newList);

    // Limpar e Fechar Modal
    setDescription('');
    setValue('');
    setModalVisible(false);
    setShowSuggestions(false);
  }

  const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemIconContainer}>
        <MaterialIcons 
          name={item.type === 'income' ? 'arrow-upward' : 'arrow-downward'} 
          size={24} color={item.type === 'income' ? '#13ec6d' : '#ef4444'} 
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.description}</Text>
        <Text style={styles.itemCategory}>{item.date} às {item.time}</Text>
      </View>
      <Text style={[styles.itemValue, { color: item.type === 'income' ? '#13ec6d' : '#ef4444' }]}>
        {item.type === 'income' ? '+ ' : '- '}{formatCurrency(item.value)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER AZUL --- */}
      <View style={styles.summaryContainer}>
        {/* Linha superior com Título e Botão + */}
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.summaryLabel}>Saldo total</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(balance)}</Text>
          </View>
          
          <TouchableOpacity style={styles.btnAddHeader} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="add" size={30} color="#3870d8" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-upward" size={16} color="#13ec6d" />
            <Text style={styles.miniCardText}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-downward" size={16} color="#ef4444" />
            <Text style={styles.miniCardText}>{formatCurrency(totalExpense)}</Text>
          </View>
        </View>
      </View>

      {/* --- LISTA DE GASTOS --- */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Últimas atividades</Text>
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* --- MODAL LATERAL (ABA) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Fundo escuro fecha o modal ao clicar */}
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          {/* Conteúdo da Aba Lateral (Direita) */}
          <View style={styles.sideMenu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Lançamento</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Seletor de Tipo */}
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]} 
                onPress={() => setType('income')}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Entrada</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]} 
                onPress={() => setType('expense')}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Saída</Text>
              </TouchableOpacity>
            </View>

            {/* Input Valor */}
            <Text style={styles.inputLabel}>Valor</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="R$ 0,00" 
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
            />

            {/* Input Descrição com Autocomplete */}
            <Text style={styles.inputLabel}>Descrição</Text>
            <View>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: Mercado, Luz..." 
                value={description}
                onChangeText={handleDescriptionChange}
              />
              {showSuggestions && (
                <View style={styles.suggestionsBox}>
                  {filteredSuggestions.map((item, index) => (
                    <TouchableOpacity key={index} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.btnSave} onPress={handleAdd}>
              <Text style={styles.btnSaveText}>SALVAR</Text>
            </TouchableOpacity>

            <Text style={styles.futureNote}>* Mais opções em breve</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // --- Header ---
  summaryContainer: {
    padding: 20,
    backgroundColor: '#3870d8',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  btnAddHeader: {
    backgroundColor: '#fff',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  summaryLabel: {
    color: '#ffffffcc',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  summaryMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  miniCardText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  
  // --- Lista ---
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  listTitle: { color: '#a1a1a1', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#3870d8',
    padding: 15, borderRadius: 15, marginBottom: 12,
  },
  itemIconContainer: { backgroundColor: '#233860', padding: 10, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  itemCategory: { color: '#a5a5a7', fontSize: 12 },
  itemValue: { fontSize: 14, fontWeight: 'bold' },

  // --- MODAL LATERAL ---
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fundo escurecido
  },
  modalBackdrop: {
    flex: 1, // Ocupa o espaço esquerdo vazio
  },
  sideMenu: {
    width: '85%', // Ocupa 85% da tela à direita
    backgroundColor: '#fff',
    padding: 25,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3870d8' },
  
  inputLabel: { color: '#64748b', marginBottom: 8, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#f1f5f9',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  
  // Autocomplete Styles
  suggestionsBox: {
    position: 'absolute',
    top: 55, // Logo abaixo do input
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 5,
    zIndex: 10,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: { color: '#333' },

  // Botões do Modal
  typeSelector: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#fff', elevation: 2 },
  typeText: { color: '#64748b', fontWeight: '600' },
  typeTextActive: { color: '#3870d8', fontWeight: 'bold' },

  btnSave: {
    backgroundColor: '#3870d8',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  futureNote: {
    textAlign: 'center',
    marginTop: 20,
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: 12
  }
});