import { useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text, Button, IconButton } from 'react-native-paper';

type Props = { onPhotoConfirmed: (uri: string) => void };

export function ScanScreen({ onPhotoConfirmed }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>We need camera access to take your eye photo.</Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
    if (photo) setCapturedUri(photo.uri);
  };

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[styles.previewOverlay, { bottom: insets.bottom + 32 }]}>
          <Button mode="outlined" textColor="#FFFFFF" onPress={() => setCapturedUri(null)}>
            Retake
          </Button>
          <Button mode="contained" onPress={() => onPhotoConfirmed(capturedUri)}>
            Use Photo
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={[styles.captureRow, { bottom: insets.bottom + 32 }]}>
        <IconButton
          icon="circle-outline"
          size={72}
          iconColor="#FFFFFF"
          onPress={handleCapture}
          style={styles.captureButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  permissionText: { textAlign: 'center', marginBottom: 8 },
  captureRow: { position: 'absolute', alignSelf: 'center' },
  captureButton: { backgroundColor: 'rgba(255,255,255,0.2)' },
  previewOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});
