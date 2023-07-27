import React, { useEffect, useState } from 'react';
import { Modal, SafeAreaView, Text, View, Button, FlatList, SectionList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import { G, Line } from 'react-native-svg';
import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Dimensions } from 'react-native';
import moment from 'moment';
import { groupBy, map } from 'lodash';

const App = () => {
    const [expenses, setExpenses] = useState([]);
    const [groupedExpenses, setGroupedExpenses] = useState([]);
    const [groupedByDateAndVendor, setGroupedByDateAndVendor] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [chartData, setChartData] = useState(null);
    const [selectedItemName, setSelectedItemName] = useState(null);


    const sendImage = async (imageAsset) => {
        let base64Img = await FileSystem.readAsStringAsync(imageAsset.uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        let jsonData = JSON.stringify({
            file: base64Img,
        });

        fetch('https://egzephscxe.execute-api.us-east-2.amazonaws.com/Prod', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }
                return response.json();
            })
            .then((responseJson) => {
                console.log(responseJson);
                fetchData();
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            sendImage(result.assets[0]);
        }
    };

    const fetchData = async () => {
        setRefreshing(true);
        fetch('https://egzephscxe.execute-api.us-east-2.amazonaws.com/Prod')
            .then((response) => response.json())
            .then((json) => {
                const cleanedJson = json.map(item => ({
                    ...item,
                    price: parseFloat(item.price.replace(',', '.').replace(/[a-zA-Z]/g, '')),
                    name: item.name
                }));
                setExpenses(cleanedJson);
                if (groupedByDateAndVendor) {
                    groupData(cleanedJson);
                }
            })
            .catch((error) => console.error(error))
            .finally(() => setRefreshing(false));
    };

    const showItemGraph = (itemName) => {
        const itemExpenses = expenses.filter(expense => expense.name === itemName);
        const vendors = [...new Set(itemExpenses.map(expense => expense.vendor))];

        const data = vendors.map(vendor => {
            const vendorExpenses = itemExpenses.filter(expense => expense.vendor === vendor);
            vendorExpenses.sort((a, b) => moment(a.date).toDate() - moment(b.date).toDate()); // Sort by date
            console.log(vendorExpenses);

            const firstExpense = vendorExpenses[0];
            const lastExpense = vendorExpenses[vendorExpenses.length - 1];

            const percentageIncrease = ((lastExpense.price - firstExpense.price) / firstExpense.price) * 100;

            const daysDifference = moment(lastExpense.date).diff(moment(firstExpense.date), 'days');

            return {
                data: vendorExpenses.map(expense => ({
                    x: new Date(moment(expense.date).toDate()),
                    y: expense.price
                })),
                svg: { stroke: `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})` },
                label: vendor,
                percentageIncrease: percentageIncrease.toFixed(2),  // added percentageIncrease
                daysDifference  // added daysDifference
            };
        });

        console.log(data);
        setSelectedItemName(itemName);
        setChartData(data);
        setModalVisible(true);
    };

    const groupData = (data) => {
        const groupedData = groupBy(data, i => [i.date, i.vendor]);
        const transformedData = map(groupedData, (items, group) => ({
            title: group,
            data: items,
        }));
        setGroupedExpenses(transformedData);
    };

    const toggleGroupedByDateAndVendor = () => {
        setGroupedByDateAndVendor(!groupedByDateAndVendor);
        if (!groupedByDateAndVendor) {
            groupData(expenses);
        }
    }

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    function splitStringByFirstSpace(inputString) {
        const index = inputString.indexOf(' ');
        if (index === -1) {
            // If no space is found, return the original string
            return [inputString];
        }

        const firstPart = inputString.substring(0, index);
        const secondPart = inputString.substring(index + 1);

        return [firstPart, secondPart];
    }

    const Item = ({ item, index }) => (
        <TouchableOpacity onPress={() => showItemGraph(item.name)} style={index % 2 === 0 ? styles.row : styles.alternateRow}>
            <Text style={styles.text}>
                <Text style={styles.firstLetter}>{splitStringByFirstSpace(item.name)[0]}</Text>
                {' '}{splitStringByFirstSpace(item.name)[1]}
            </Text>
            <Text style={[styles.text, item.price < 0 ? styles.greenText : styles.redText]}>{item.price.toFixed(2)}</Text>
        </TouchableOpacity>
    );

    const Header = ({ section }) => {
        const [firstPart, secondPart] = section.title.split(',');

        return (
            <View style={styles.header}>
                <Text style={styles.headerTextLarge}>{secondPart}</Text>
                <Text style={styles.headerTextSmall}>{firstPart}</Text>
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text >Prices over time for</Text>
                    <Text style={styles.modalTitle}>{selectedItemName}</Text>
                    {chartData &&
                        <View style={{ height: 200, flexDirection: 'row' }}>
                            <YAxis
                                style={{ width: 35 }}
                                data={chartData.flatMap(d => d.data.map(p => p.y))}
                                contentInset={{ bottom: 0 }}
                                svg={{
                                    fill: 'grey',
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                }}
                                numberOfTicks={4}
                                formatLabel={(value) => `${value.toFixed(2)}`}
                            />
                            <View style={{ flex: 1, marginLeft: 0 }}>
                                <LineChart
                                    style={{ flex: 1, }}
                                    data={chartData}
                                    xAccessor={({ item }) => item.x}
                                    yAccessor={({ item }) => item.y}
                                    curve={shape.curveNatural}
                                    contentInset={{ top: 20, bottom: 20 }}
                                    svg={{ strokeWidth: 3 }} // Make the line thicker
                                >
                                </LineChart>
                                <XAxis
                                    style={{ marginHorizontal: -10, marginTop: 0 }}
                                    data={chartData.flatMap(d => d.data.map(p => p.x).sort((a, b) => moment(a).toDate() - moment(b).toDate()))}
                                    scale={scale.scaleTime}
                                    formatLabel={(value, index) => moment(chartData.flatMap(d => d.data.map(p => p.x))[index]).format('MMM')}
                                    svg={{ fontSize: 10, fill: 'black' }}
                                />

                            </View>
                        </View>
                    }
                    {chartData ? (
                        <View style={styles.legendContainer}>
                            {chartData.map((vendor, index) => (
                                <View key={index} style={styles.legendLine}>
                                    <Text
                                        style={{
                                            ...styles.legendText,
                                            color: vendor.svg.stroke || '#000',
                                        }}
                                    >
                                        &#9679; {vendor.label}
                                    </Text>
                                    <View style={styles.rightAlignText}>
                                        <Text
                                            style={{
                                                color: 'black',
                                                fontSize: 10, // Increase font size as needed
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: 'red',
                                                    fontSize: 12, // Increase font size as needed
                                                }}
                                            >
                                                {' ↗'}{vendor.percentageIncrease}%
                                            </Text>
                                            {' '} in {vendor.daysDifference} days
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : null}

                    <Button title="Close" onPress={() => setModalVisible(false)} />
                </View>
            </Modal>




            {groupedByDateAndVendor ? (
                <SectionList
                    sections={groupedExpenses}
                    keyExtractor={(item, index) => item + index}
                    renderItem={({ item, index }) => <Item item={item} index={index} />}
                    renderSectionHeader={({ section }) => <Header section={section} />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
                />
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => <Item item={item} index={index} />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
                />
            )}
            <TouchableOpacity onPress={pickImage} style={styles.fab}>
                <Ionicons name="add" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleGroupedByDateAndVendor} style={styles.groupFab}>
                <Ionicons name="list" size={30} color="white" />
            </TouchableOpacity>

        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 36,
        backgroundColor: '#F0F0F0', // Light grey
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    text: {
        fontSize: 16,
    },
    redText: {
        color: '#FF4757', // Red
    },
    greenText: {
        color: '#2ED573', // Green
    },
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 80,
        bottom: 10,
        backgroundColor: '#1E90FF', // Bright blue
        borderRadius: 30,
        elevation: 8,
    },
    groupFab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 10,
        bottom: 10,
        backgroundColor: '#1E90FF', // Bright blue
        borderRadius: 30,
        elevation: 8,
    },
    header: {
        backgroundColor: '#1E90FF', // Bright blue
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    headerTextLarge: {
        fontSize: 20,
        fontWeight: '600',
        color: '#F0F0F0', // Light grey
    },
    headerTextSmall: {
        fontSize: 14,
        color: '#B2BABB', // Lighter blue
        paddingTop: 2,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 20,
        marginTop: '40%',
        borderRadius: 20,
        padding: 35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    firstLetter: {
        fontSize: 20,
    },
    legendContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        margin: 10,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    legendLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rightAlignText: {
        alignItems: 'flex-end',
    },
    legendText: {
        fontSize: 16,
        fontWeight: 600,
        margin: 2,
    },
    container: {
        flex: 1,
        paddingTop: 36,
        backgroundColor: '#F0F0F0',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        paddingBottom: 7,
        paddingTop: 7,
        marginBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#FFFFFF',
    },
    alternateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginBottom: 0,
        paddingBottom: 7,
        paddingTop: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: '#F5F5F5', // Light Grey 100 from Material Design
    },
    text: {
        fontSize: 16,
    },
    header: {
        backgroundColor: '#3F51B5', // Indigo 500 from Material Design
        paddingTop: 2,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 2,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
    },
    headerTextLarge: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF', // White text
    },
    headerTextSmall: {
        fontSize: 14,
        color: '#C5CAE9', // Indigo 100 for less important text
        paddingTop: 2,
    },
});


export default App;