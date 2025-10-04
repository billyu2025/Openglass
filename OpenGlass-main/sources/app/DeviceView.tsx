import * as React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from 'react-native';
import { rotateImage } from '../modules/imaging';
import { toBase64Image } from '../utils/base64';
import { Agent } from '../agent/Agent';
import { InvalidateSync } from '../utils/invalidateSync';

function usePhotos(device: BluetoothRemoteGATTServer) {

    // Subscribe to device
    const [photos, setPhotos] = React.useState<Uint8Array[]>([]);
    const [subscribed, setSubscribed] = React.useState<boolean>(false);
    React.useEffect(() => {
        (async () => {

            let previousChunk = -1;
            let buffer: Uint8Array = new Uint8Array(0);
            function onChunk(id: number | null, data: Uint8Array) {

                // Resolve if packet is the first one
                if (previousChunk === -1) {
                    if (id === null) {
                        return;
                    } else if (id === 0) {
                        previousChunk = 0;
                        buffer = new Uint8Array(0);
                    } else {
                        return;
                    }
                } else {
                    if (id === null) {
                        console.log('Photo received', buffer);
                        rotateImage(buffer, '270').then((rotated) => {
                            console.log('Rotated photo', rotated);
                            setPhotos((p) => [...p, rotated]);
                        });
                        previousChunk = -1;
                        return;
                    } else {
                        if (id !== previousChunk + 1) {
                            previousChunk = -1;
                            console.error('Invalid chunk', id, previousChunk);
                            return;
                        }
                        previousChunk = id;
                    }
                }

                // Append data
                buffer = new Uint8Array([...buffer, ...data]);
            }

            // Subscribe for photo updates
            const service = await device.getPrimaryService('19B10000-E8F2-537E-4F6C-D104768A1214'.toLowerCase());
            const photoCharacteristic = await service.getCharacteristic('19b10005-e8f2-537e-4f6c-d104768a1214');
            await photoCharacteristic.startNotifications();
            setSubscribed(true);
            photoCharacteristic.addEventListener('characteristicvaluechanged', (e) => {
                let value = (e.target as BluetoothRemoteGATTCharacteristic).value!;
                let array = new Uint8Array(value.buffer);
                if (array[0] == 0xff && array[1] == 0xff) {
                    onChunk(null, new Uint8Array());
                } else {
                    let packetId = array[0] + (array[1] << 8);
                    let packet = array.slice(2);
                    onChunk(packetId, packet);
                }
            });
            // Start automatic photo capture every 5s
            const photoControlCharacteristic = await service.getCharacteristic('19b10006-e8f2-537e-4f6c-d104768a1214');
            await photoControlCharacteristic.writeValue(new Uint8Array([0x05]));
        })();
    }, []);

    return [subscribed, photos] as const;
}

export const DeviceView = React.memo((props: { device: BluetoothRemoteGATTServer | null }) => {
    console.log('DeviceView render - device:', !!props.device);
    
    // 如果有设备连接，使用硬件模式
    const [subscribed, photos] = props.device ? usePhotos(props.device) : [false, []];
    const agent = React.useMemo(() => new Agent(), []);
    const agentState = agent.use();

    // Background processing agent (仅在有设备时)
    const processedPhotos = React.useRef<Uint8Array[]>([]);
    const sync = React.useMemo(() => {
        let processed = 0;
        return new InvalidateSync(async () => {
            if (processedPhotos.current.length > processed) {
                let unprocessed = processedPhotos.current.slice(processed);
                processed = processedPhotos.current.length;
                await agent.addPhoto(unprocessed);
            }
        });
    }, []);
    
    React.useEffect(() => {
        if (props.device) {
            processedPhotos.current = photos;
            sync.invalidate();
        }
    }, [photos, props.device]);

    // 暂时移除语音合成功能
    // React.useEffect(() => {
    //     if (agentState.answer) {
    //         textToSpeech(agentState.answer)
    //     }
    // }, [agentState.answer])

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            {/* 软件模式：显示状态信息 */}
            {!props.device && (
                <View style={{ position: 'absolute', top: 50, left: 20, right: 20, zIndex: 10 }}>
                    <Text style={{ color: 'white', fontSize: 24, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' }}>
                        🤖 OpenGlass AI Assistant
                    </Text>
                    <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
                        Software Mode - No hardware connected
                    </Text>
                    <Text style={{ color: '#aaa', fontSize: 14, textAlign: 'center' }}>
                        You can still chat with AI using Ollama
                    </Text>
                </View>
            )}

            {/* 硬件模式：显示照片 */}
            {props.device && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {photos.map((photo, index) => (
                            <Image key={index} style={{ width: 100, height: 100 }} source={{ uri: toBase64Image(photo) }} />
                        ))}
                    </View>
                </View>
            )}

            {/* 主聊天界面 */}
            <View style={{ 
                backgroundColor: 'rgb(28 28 28)', 
                height: 500, 
                width: '90%', 
                maxWidth: 600,
                borderRadius: 20, 
                flexDirection: 'column', 
                padding: 30,
                borderWidth: 1,
                borderColor: '#333'
            }}>
                <View style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                    {agentState.loading && (
                        <View style={{ alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={"white"} />
                            <Text style={{ color: 'white', marginTop: 10 }}>AI is thinking...</Text>
                        </View>
                    )}
                    {agentState.answer && !agentState.loading && (
                        <ScrollView style={{ flexGrow: 1, flexBasis: 0, width: '100%' }}>
                            <Text style={{ color: 'white', fontSize: 18, lineHeight: 24 }}>
                                {agentState.answer}
                            </Text>
                        </ScrollView>
                    )}
                    {!agentState.answer && !agentState.loading && (
                        <Text style={{ color: '#888', fontSize: 16, textAlign: 'center' }}>
                            {props.device ? 'What do you need?' : 'Ask me anything...'}
                        </Text>
                    )}
                </View>
                <TextInput
                    style={{ 
                        color: 'white', 
                        height: 50, 
                        fontSize: 16, 
                        borderRadius: 12, 
                        backgroundColor: 'rgb(48 48 48)', 
                        padding: 15,
                        borderWidth: 1,
                        borderColor: '#555'
                    }}
                    placeholder={props.device ? 'What do you need?' : 'Ask me anything...'}
                    placeholderTextColor={'#888'}
                    readOnly={agentState.loading}
                    onSubmitEditing={(e) => {
                        console.log('Text submitted:', e.nativeEvent.text);
                        if (props.device) {
                            agent.answer(e.nativeEvent.text);
                        } else {
                            agent.chat(e.nativeEvent.text);
                        }
                    }}
                />
            </View>
        </View>
    );
});