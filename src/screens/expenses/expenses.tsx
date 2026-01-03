import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, SafeAreaView, 
  TextInput, TouchableOpacity, Keyboard, Platform, StatusBar, Alert, Modal, TouchableWithoutFeedback 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // Importação necessária para sincronia

// Definindo o formato dos dados
interface Transaction {
  id: string;
  description: string;
  value: number;
  type: 'income' | 'expense';
  date: string;
  time: string;
}

const DEFAULT_SUGGESTIONS = [
  'Supermercado', 'Padaria', 'Restaurante', 'Combustível', 
  'Uber / Transporte', 'Aluguel', 'Conta de Luz', 'Conta de Água', 
  'Internet', 'Salário', 'Freelance', 'Investimento', 'Lazer', 
  'Farmácia', 'Academia', 'Manutenção Bike'
];

export default function ExpensesScreen() {
  const [list, setList] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  const [balance, setBalance] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);

  const [modalVisible, setModalVisible] = useState<boolean>(false); 
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- ESTADO DE PRIVACIDADE SINCRONIZADO ---
  const [isVisible, setIsVisible] = useState(true);

  const [description, setDescription] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense'); 
  
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // --- LOGICA DE SINCRONIZAÇÃO GLOBAL ---
  useFocusEffect(
    useCallback(() => {
      const loadSyncData = async () => {
        const saved = await AsyncStorage.getItem('@myfinance:visibility');
        if (saved !== null) {
          setIsVisible(JSON.parse(saved));
        }
        loadData();
        loadCategories();
      };
      loadSyncData();
    }, [])
  );

  const toggleVisibility = async () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    await AsyncStorage.setItem('@myfinance:visibility', JSON.stringify(newValue));
  };

  useEffect(() => {
    calculateTotals(list);
  }, [list]);

  // --- LÓGICA DE AUTOCOMPLETE ---
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    if (text.length > 0) {
      const allOptions = [...DEFAULT_SUGGESTIONS, ...customCategories];
      const filtered = allOptions.filter(item => 
        item.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredSuggestions([...new Set(filtered)]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setDescription(suggestion);
    setShowSuggestions(false);
  };

  // --- PERSISTÊNCIA ---
  async function loadData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:transactions');
      if (jsonValue != null) setList(JSON.parse(jsonValue));
    } catch (e) { console.log(e); }
  }

  async function loadCategories() {
    try {
      const jsonValue = await AsyncStorage.getItem('@myfinance:categories');
      if (jsonValue != null) setCustomCategories(JSON.parse(jsonValue));
    } catch (e) { console.log(e); }
  }

  async function saveData(newList: Transaction[]) {
    try {
      const jsonValue = JSON.stringify(newList);
      await AsyncStorage.setItem('@myfinance:transactions', jsonValue);
    } catch (e) { console.log(e); }
  }

  async function saveCategories(newCategories: string[]) {
    try {
      const jsonValue = JSON.stringify(newCategories);
      await AsyncStorage.setItem('@myfinance:categories', jsonValue);
    } catch (e) { console.log(e); }
  }

  function calculateTotals(currentList: Transaction[]) {
    let total = 0, income = 0, expense = 0;
    currentList.forEach((item) => {
      const val = Number(item.value);
      if (item.type === 'income') { total += val; income += val; } 
      else { total -= val; expense += val; }
    });
    setBalance(total);
    setTotalIncome(income);
    setTotalExpense(expense);
  }

  // --- AÇÕES ---
  function handleAddCategory() {
    if (newCategoryName.trim() === '') {
      Alert.alert('Erro', 'Digite um nome para a categoria');
      return;
    }
    const updatedCategories = [...customCategories, newCategoryName];
    setCustomCategories(updatedCategories);
    saveCategories(updatedCategories);
    setNewCategoryName('');
    Alert.alert('Sucesso', `Categoria "${newCategoryName}" adicionada!`);
  }

  function handleSaveTransaction() {
    if (value === '') {
      Alert.alert('Atenção', 'Informe o valor!');
      return;
    }
    const numericValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numericValue)) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }
    if (description.trim() === '') {
      Alert.alert('Atenção', 'Informe uma descrição para o lançamento!');
      return;
    }
    let newList = [...list];
    if (editingId) {
      newList = newList.map(item => item.id === editingId ? { ...item, description, value: numericValue, type } : item);
      setEditingId(null);
    } else {
      const newTransaction: Transaction = {
        id: String(new Date().getTime()),
        description, value: numericValue, type,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      newList = [newTransaction, ...newList];
    }
    setList(newList);
    saveData(newList);
    setValue(''); setDescription(''); setShowSuggestions(false); Keyboard.dismiss();
  }

  const openEditTransaction = (item: Transaction) => {
    setEditingId(item.id); setDescription(item.description); setValue(String(item.value)); setType(item.type);
  };

  const cancelEditing = () => {
    setEditingId(null); setValue(''); setDescription(''); setShowSuggestions(false); Keyboard.dismiss();
  }

  function handleClearAll() {
    Alert.alert("Resetar App", "Apagar todos os lançamentos?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: async () => {
          setList([]); await AsyncStorage.removeItem('@myfinance:transactions'); setModalVisible(false);
      }}
    ]);
  }

  const formatCurrency = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Helper de privacidade
  const renderValue = (val: number) => {
    return isVisible ? formatCurrency(val) : '••••••';
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={[styles.itemCard, editingId === item.id && styles.itemCardEditing]} 
      onPress={() => openEditTransaction(item)}
    >
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
        {item.type === 'income' ? '+ ' : '- '}{renderValue(item.value)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER CENTRALIZADO */}
      <View style={styles.summaryContainer}>
        <View style={styles.headerContent}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.summaryLabel}>Saldo total</Text>
            <Text style={styles.summaryAmount}>{renderValue(balance)}</Text>
          </View>

          <View style={styles.headerRightActions}>
              {/* BOTÃO DO OLHO SINCRONIZADO */}
              <TouchableOpacity onPress={toggleVisibility} style={styles.btnEyeHeader}>
                 <Ionicons name={isVisible ? "eye" : "eye-off"} size={24} color="#ffffffcc" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.btnAddHeader} onPress={() => setModalVisible(true)}>
                <MaterialIcons name="add" size={30} color="#3870d8" />
              </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-upward" size={16} color="#13ec6d" />
            <Text style={styles.miniCardText}>{renderValue(totalIncome)}</Text>
          </View>
          <View style={styles.summaryMiniCard}>
            <MaterialIcons name="arrow-downward" size={16} color="#ef4444" />
            <Text style={styles.miniCardText}>{renderValue(totalExpense)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainInputContainer}>
        <View style={styles.quickTypeSelector}>
           <TouchableOpacity 
             style={[styles.quickTypeBtn, type === 'income' ? styles.quickIncomeActive : styles.quickTypeInactive]} 
             onPress={() => setType('income')}
           >
             <MaterialIcons name="arrow-upward" size={20} color={type === 'income' ? '#fff' : '#13ec6d'} />
             <Text style={[styles.quickTypeText, type === 'income' ? {color:'#fff'} : {color:'#13ec6d'}]}>Entrada</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.quickTypeBtn, type === 'expense' ? styles.quickExpenseActive : styles.quickTypeInactive]} 
             onPress={() => setType('expense')}
           >
             <MaterialIcons name="arrow-downward" size={20} color={type === 'expense' ? '#fff' : '#ef4444'} />
             <Text style={[styles.quickTypeText, type === 'expense' ? {color:'#fff'} : {color:'#ef4444'}]}>Saída</Text>
           </TouchableOpacity>
        </View>
        <View style={styles.valueInputWrapper}>
          <Text style={styles.currencyPrefix}>R$</Text>
          <TextInput style={styles.mainValueInput} placeholder="0,00" placeholderTextColor="#cbd5e1" keyboardType="numeric" value={value} onChangeText={setValue} />
        </View>
        <View style={styles.descInputWrapper}>
          <TextInput style={styles.descInput} placeholder="Descrição (ex: Creche)" value={description} onChangeText={handleDescriptionChange} />
          {editingId ? (
             <View style={{flexDirection: 'row', gap: 10}}>
                <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing}><MaterialIcons name="close" size={24} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveTransaction}><MaterialIcons name="check" size={24} color="#fff" /></TouchableOpacity>
             </View>
          ) : (
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveTransaction}><MaterialIcons name="check" size={24} color="#fff" /></TouchableOpacity>
          )}
        </View>
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

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>{editingId ? 'Editando item selecionado...' : 'Últimas atividades'}</Text>
        <FlatList data={list} renderItem={renderItem} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} />
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}><View style={styles.modalBackdrop} /></TouchableWithoutFeedback>
          <View style={styles.sideMenu}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Configurações</Text><TouchableOpacity onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color="#64748b" /></TouchableOpacity></View>
            <Text style={styles.inputLabel}>Adicionar Nova Opção</Text>
            <View style={styles.addCategoryRow}>
              <TextInput style={styles.modalInput} placeholder="Nome da categoria..." value={newCategoryName} onChangeText={setNewCategoryName} />
              <TouchableOpacity style={styles.btnAddCategory} onPress={handleAddCategory}><MaterialIcons name="add" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <View style={styles.dangerZone}><TouchableOpacity style={styles.btnDelete} onPress={handleClearAll}><MaterialIcons name="delete-forever" size={24} color="#ef4444" /><Text style={styles.btnDeleteText}>Apagar tudo</Text></TouchableOpacity></View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  summaryContainer: { padding: 20, backgroundColor: '#3870d8', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 40, elevation: 5, zIndex: 1 },
  headerContent: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', width: '100%', position: 'relative', marginBottom: 15 },
  headerRightActions: { position: 'absolute', right: 0, top: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnEyeHeader: { padding: 5 },
  btnAddHeader: { backgroundColor: '#fff', width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { color: '#ffffffcc', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  summaryAmount: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', marginTop: 5 },
  row: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
  summaryMiniCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  miniCardText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  mainInputContainer: { marginHorizontal: 20, marginTop: -30, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, zIndex: 10, marginBottom: 10 },
  quickTypeSelector: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  quickTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 5 },
  quickTypeInactive: { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  quickIncomeActive: { backgroundColor: '#13ec6d', borderColor: '#13ec6d' },
  quickExpenseActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  quickTypeText: { fontSize: 14, fontWeight: 'bold' },
  valueInputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5, marginBottom: 15 },
  currencyPrefix: { fontSize: 24, color: '#94a3b8', fontWeight: '600', marginRight: 10 },
  mainValueInput: { flex: 1, fontSize: 32, fontWeight: 'bold', color: '#334155' },
  descInputWrapper: { flexDirection: 'row', gap: 10 },
  descInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 15, height: 50, fontSize: 16 },
  confirmBtn: { width: 50, height: 50, backgroundColor: '#3870d8', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { width: 50, height: 50, backgroundColor: '#ef4444', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  suggestionsBox: { position: 'absolute', top: 185, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', elevation: 5, maxHeight: 150 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionText: { color: '#333' },
  listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 10, zIndex: 1 },
  listTitle: { color: '#a1a1a1', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3870d8', padding: 15, borderRadius: 15, marginBottom: 12 },
  itemCardEditing: { borderWidth: 2, borderColor: '#fbbf24' },
  itemIconContainer: { backgroundColor: '#233860', padding: 10, borderRadius: 12 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  itemCategory: { color: '#a5a5a7', fontSize: 12 },
  itemValue: { fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBackdrop: { flex: 1 },
  sideMenu: { width: '85%', backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderBottomLeftRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3870d8' },
  inputLabel: { color: '#3870d8', marginBottom: 5, fontWeight: 'bold' },
  helperText: { color: '#64748b', fontSize: 12, marginBottom: 10 },
  addCategoryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modalInput: { flex: 1, backgroundColor: '#f1f5f9', padding: 15, borderRadius: 10, fontSize: 16, color: '#333' },
  btnAddCategory: { width: 50, backgroundColor: '#13ec6d', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dangerZone: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  btnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  btnDeleteText: { color: '#ef4444', fontWeight: '600', fontSize: 14 }
});