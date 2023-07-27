import React, { useEffect, useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';

const GridScreen = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch('url_to_GetDocumentsFunc')
      .then(response => response.json())
      .then(data => setDocuments(data));
  }, []);

  return (
    <View>
      <FlatList
        data={documents}
        keyExtractor={item => item.name}
        numColumns={3}
        renderItem={({ item }) => (
          <View>
            <Image
              style={{ width: 100, height: 100 }}
              source={{ uri: `data:image/png;base64,${item.image}` }}
            />
            <Text>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default GridScreen;