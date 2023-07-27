import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

const ExpenseScreen = () => {
  const [input, setInput] = useState('');
  const handleAskClick = async () => {
    try {
      const response = await axios.post('http://localhost:3000/PostExpenseFunc', { question: input });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View>
      <Text>Expense Screen</Text>
      <TextInput
        value={input}
        onChangeText={text => setInput(text)}
        placeholder="Ask something..."
      />
      <Button
        title="Ask"
        onPress={handleAskClick}
      />
    </View>
  );
};

export default ExpenseScreen;