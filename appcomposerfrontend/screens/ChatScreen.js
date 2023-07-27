import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

const ChatScreen = () => {
  const [input, setInput] = useState('');

  const handleAskClick = async () => {
    try {
      const response = await axios.post('http://localhost:3000/PostChatFunc', { question: input });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View>
      <Text>Chat Screen</Text>
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

export default ChatScreen;