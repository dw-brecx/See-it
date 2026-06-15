import * as React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  Image,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

type Photo = { id: string; photo_url: string };

/**
 * Full-screen swipeable photo viewer. Tap-anywhere-but-the-X dismisses.
 * Pinch-to-zoom is deferred (would require a pan/pinch gesture handler
 * + a worklet); for v1 swipe + tap-to-close is plenty.
 */
export function PhotoLightbox({
  open,
  photos,
  startIndex,
  onClose,
}: {
  open: boolean;
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const w = Dimensions.get('window').width;
  const h = Dimensions.get('window').height;
  const listRef = React.useRef<FlatList<Photo>>(null);
  const [index, setIndex] = React.useState(startIndex);

  React.useEffect(() => {
    if (open) {
      setIndex(startIndex);
      // Defer until after the modal mounts so FlatList layout is ready.
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: startIndex * w, animated: false });
      });
    }
  }, [open, startIndex, w]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          hitSlop={10}
          style={{
            position: 'absolute',
            top: insets.top + 8,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={18} color="#FFFFFF" />
        </Pressable>

        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(p) => p.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / w);
            setIndex(i);
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={onClose}
              style={{
                width: w,
                height: h,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={{ uri: item.photo_url }}
                style={{ width: w, height: w }}
                resizeMode="contain"
              />
            </Pressable>
          )}
        />

        {photos.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: insets.bottom + 28,
              alignSelf: 'center',
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
              {index + 1} / {photos.length}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
