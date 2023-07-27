import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob';

const GridScreen = () => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const response = await RNFetchBlob.fetch('GET', 'https://p7i5azkn3g.execute-api.us-east-2.amazonaws.com/Prod/Documents');
    const base64Str = response.json();
    const images = base64Str.map((str) => `data:image/png;base64,${str}`);
    setImages(images);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image style={styles.image} source={{ uri: item }} />
    </View>
  );

  return (
    <FlatList
      data={images}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      numColumns={3}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    flex: 1,
    margin: 3,
  },
  image: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
});

export default GridScreen;